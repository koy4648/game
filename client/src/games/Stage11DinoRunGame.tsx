/*
 * Stage 11 - 보성 녹차마라톤: 슈퍼마리오 도트 스타일 × 녹차 마을
 *
 * 디자인: 클래식 슈퍼마리오 8비트 × 녹차 테마
 *   - 배경: 마리오 스타일 파란 하늘, 구름, 녹차 산
 *   - 지형: 마리오 블록 스타일 플랫폼 + 녹차 색상
 *   - 장애물: 마리오 월드의 적 (녹차 테마로 재해석)
 *   - 아이템: 마리오 동전 → 녹차 잎
 *   - 캐릭터: 마리오 스타일 도트 러너
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type GameStatus = "idle" | "playing" | "gameover" | "step_clear" | "cleared";
type SpawnType = "obstacle" | "item" | "super_item" | "obstacle2";

interface Sprite { id: number; x: number; type: SpawnType; }
interface FloatEffect { id: number; text: string; x: number; y: number; life: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

// ── 캔버스 해상도 (저해상도 → CSS 업스케일) ──────────────────────────────────
const PX = 4;    // 1도트 = 4px (게임 창 더 키우기)
const CW = 320;  // 캔버스 너비 (도트)
const CH = 120;   // 캔버스 높이 (도트)
const GY = 92;   // 바닥 y

const PLW = 13;   // 플레이어 너비
const PLH = 16;   // 플레이어 높이
const PLX = 24;   // 플레이어 x

const OBW = 11;   // 장애물
const OBH = 11;
const ITW = 9;    // 아이템
const ITH = 9;

const GRAVITY = 0.22;
const JUMP_VY = -5.0;
const MAX_FALL = 5.2;

const STEP1_TARGET = 10000;
const STEP2_TARGET = 42195;
const GEL_BONUS = 500;
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1500;
const STAR_MS = 5000; // 무적 5초

const STEP_CONFIG = {
  1: { scrollSpeed: 1.6, spawnInterval: 92, itemChance: 0.28, scorePerFrame: 3 },
  2: { scrollSpeed: 3.8, spawnInterval: 50, itemChance: 0.35, scorePerFrame: 8 },
} as const;

const IMG_YEONGSEO = "/webdev-static-assets/caricature-run-yeongseo.png";
const IMG_JINSEONG = "/webdev-static-assets/caricature-run-jinseong.png";
const IMG_OBSTACLE = "/webdev-static-assets/obstacle-bush.png";
const IMG_GEL = "/webdev-static-assets/item-energy-gel.png";

// ── 슈퍼마리오 × 녹차 팔레트 ──────────────────────────────────────────────────
const P = {
  // 하늘 (마리오 스타일)
  skyT: "#4a90e2",  // 진한 파란 상단
  skyB: "#87ceeb",  // 밝은 파란 하단
  cloud: "#ffffff",
  cloudS: "#e0f0ff",
  // 녹차 산 (마리오 산 스타일)
  mtn1: "#2d5016",  // 진한 녹차
  mtn2: "#4a7c2c",  // 중간 녹차
  mtn3: "#6ba547",  // 밝은 녹차
  // 블록 (마리오 블록 스타일)
  block1: "#6ba547", // 녹차 블록
  block2: "#4a7c2c", // 어두운 녹차
  block3: "#8bc34a", // 밝은 녹차
  blockHL: "#a5d6a7", // 블록 하이라이트
  // 파이프 (마리오 파이프 → 녹차 파이프)
  pipe: "#2d5016",
  pipeHL: "#4a7c2c",
  // 적 (마리오 Goomba → 녹차 벌레)
  enemy1: "#8b4513", // 갈색 벌레
  enemy2: "#a0522d",
  // 동전 (마리오 동전 → 녹차 잎)
  coin: "#ffd700",
  coinHL: "#ffed4e",
  // UI
  uiBg: "#f0faf0",
  uiBd: "#66bb6a",
  uiTxt: "#2e7d32",
  uiGold: "#f9a825",
  uiPink: "#f06292",
  uiBlue: "#42a5f5",
  uiRed: "#ef5350",
  // 기타
  white: "#ffffff",
  black: "#333333",
  shadow: "rgba(0,0,0,0.12)",
};

// ── 도트 헬퍼 ────────────────────────────────────────────────────────────────
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function pixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 5, align: CanvasTextAlign = "left") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.imageSmoothingEnabled = false;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── 배경 레이어 드로우 함수들 ─────────────────────────────────────────────────

// 1. 하늘 (마리오 스타일 파란 그라디언트)
function drawSky(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < GY; y++) {
    const t = y / GY;
    const r = Math.round(74 + t * 20);
    const g = Math.round(144 + t * 20);
    const b = Math.round(226);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, CW, 1);
  }
}

// 2. 마리오 스타일 구름 (눈 달린 구름)
const CLOUDS = [
  { ox: 20, y: 8, w: 20, h: 6, speed: 0.12 },
  { ox: 90, y: 12, w: 16, h: 5, speed: 0.09 },
  { ox: 150, y: 6, w: 24, h: 7, speed: 0.14 },
  { ox: 220, y: 14, w: 14, h: 4, speed: 0.10 },
];

function drawClouds(ctx: CanvasRenderingContext2D, frame: number) {
  for (const cl of CLOUDS) {
    const cx = ((cl.ox + frame * cl.speed) % (CW + cl.w + 10));
    const x = cx > CW + 5 ? cx - CW - cl.w - 10 : cx;

    // 구름 몸통
    dot(ctx, x + 1, cl.y + 2, P.cloud, cl.w - 2, cl.h - 2);
    dot(ctx, x, cl.y + 1, P.cloud, cl.w, cl.h - 1);

    // 구름 음영
    dot(ctx, x + 1, cl.y + 2, P.cloudS, cl.w - 2, 1);

    // 눈 (마리오 스타일)
    dot(ctx, x + 3, cl.y, P.black, 2, 2);
    dot(ctx, x + cl.w - 5, cl.y, P.black, 2, 2);
    dot(ctx, x + 3, cl.y, P.white, 1, 1);
    dot(ctx, x + cl.w - 5, cl.y, P.white, 1, 1);
  }
}

// 3. 녹차 산 (마리오 산 스타일 - 톱니 모양)
function drawMountains(ctx: CanvasRenderingContext2D, off: number) {
  const mtnY = GY - 22;
  const pattern = 32;
  const offset = Math.round(off * 0.18) % pattern;

  // 산 프로필 (톱니 모양)
  for (let x = 0; x < CW; x++) {
    const px = (x + offset) % pattern;
    let h = 0;
    if (px < 8) h = px;
    else if (px < 16) h = 16 - px;
    else if (px < 24) h = px - 16;
    else h = 32 - px;

    const topY = mtnY - h;
    dot(ctx, x, topY, P.mtn1, 1, h);
    dot(ctx, x, topY, P.mtn2, 1, 1);
  }
}

// 4. 마리오 블록 플랫폼 (배경)
function drawBlockPlatforms(ctx: CanvasRenderingContext2D, off: number) {
  const blockSize = 8;
  const offset = Math.round(off * 0.35) % (blockSize * 3);

  // 중간 플랫폼들
  const platforms = [
    { y: GY - 28, start: 0, length: 40 },
    { y: GY - 18, start: 60, length: 50 },
  ];

  for (const platform of platforms) {
    for (let x = -offset; x < CW + blockSize; x += blockSize) {
      if (x + blockSize > platform.start && x < platform.start + platform.length) {
        // 블록 그리기
        dot(ctx, x, platform.y, P.block2, blockSize, 1);
        dot(ctx, x, platform.y + 1, P.block1, blockSize - 1, blockSize - 2);
        dot(ctx, x + 1, platform.y + 1, P.blockHL, blockSize - 2, 1);
      }
    }
  }
}

// 5. 녹차밭 (바닥)
function drawTeaField(ctx: CanvasRenderingContext2D, off: number) {
  // 바닥
  dot(ctx, 0, GY, P.block1, CW, 4);
  dot(ctx, 0, GY, P.block2, CW, 1);
  dot(ctx, 0, GY + 1, P.blockHL, CW, 1);

  // 블록 패턴 (마리오 스타일)
  const blockSize = 8;
  const offset = Math.round(off) % blockSize;

  for (let x = -offset; x < CW; x += blockSize) {
    dot(ctx, x, GY + 2, P.block2, 1, 2);
    dot(ctx, x + blockSize - 1, GY + 2, P.block2, 1, 2);
  }

  // 배경 녹차밭
  dot(ctx, 0, GY + 4, P.mtn3, CW, CH - GY - 4);
}

// 6. 장애물 (마리오 Goomba → 녹차 벌레)
function drawObstacle(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null, type: SpawnType) {
  const isObstacle2 = type === "obstacle2";
  const y = isObstacle2 ? GY - OBH - 6 : GY - OBH;
  if (img && !isObstacle2) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, OBW, OBH);
    ctx.restore(); return;
  }

  if (isObstacle2) {
    // 거북이 등껍질 (파란색)
    dot(ctx, x+2, y+4, "#0055aa", 7, 6);
    dot(ctx, x+1, y+5, "#0055aa", 9, 5);
    dot(ctx, x+2, y+4, "#88ccff", 3, 2); // 반짝임
    dot(ctx, x, y+8, "#ffcc99", 11, 2); // 얼굴/발
    dot(ctx, x+1, y+9, P.black, 1, 1); // 눈
  } else {
    // 마리오 Goomba 스타일 (녹차 벌레)
    dot(ctx, x + 1, y + 2, P.enemy1, 9, 8);
    dot(ctx, x, y + 3, P.enemy1, 11, 6);
    dot(ctx, x + 1, y + 2, P.enemy2, 9, 1);
    dot(ctx, x + 2, y + 4, P.white, 2, 2);
    dot(ctx, x + 7, y + 4, P.white, 2, 2);
    dot(ctx, x + 2, y + 4, P.black, 1, 1);
    dot(ctx, x + 7, y + 4, P.black, 1, 1);
  }

  // 그림자
  dot(ctx, x + 1, GY, P.shadow, 9, 1);
}

// 7. 아이템 (마리오 동전 → 녹차 잎 또는 슈퍼 스타)
function drawGel(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null, frame: number, type: SpawnType) {
  const bob = Math.round(Math.sin(frame * 0.14) * 1.5);
  const y = GY - ITH - 4 + bob;
  const isStar = type === "super_item";

  if (isStar) {
    // 슈퍼 스타 마리오 스타일 (반짝이는 별)
    const color = (Math.floor(frame / 4) % 2 === 0) ? "#ffff00" : "#ffaa00";
    dot(ctx, x+4, y, color, 3, 11);
    dot(ctx, x, y+4, color, 11, 3);
    dot(ctx, x+1, y+2, color, 9, 7);
    dot(ctx, x+2, y+1, color, 7, 9);
    // 눈
    dot(ctx, x+3, y+4, P.black, 1, 2);
    dot(ctx, x+7, y+4, P.black, 1, 2);
    return;
  }

  if (img) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, ITW, ITH);
    ctx.restore(); return;
  }

  // 마리오 동전 스타일 (녹차 잎)
  // 동전 테두리
  dot(ctx, x + 2, y, P.coin, 5, 1);
  dot(ctx, x + 1, y + 1, P.coin, 7, 1);
  dot(ctx, x, y + 2, P.coin, 9, 5);
  dot(ctx, x + 1, y + 7, P.coin, 7, 1);
  dot(ctx, x + 2, y + 8, P.coin, 5, 1);

  // 동전 내부
  dot(ctx, x + 2, y + 1, P.coinHL, 5, 1);
  dot(ctx, x + 2, y + 2, P.coinHL, 5, 4);

  // 잎 모양 (녹차 테마)
  dot(ctx, x + 4, y + 3, P.mtn1, 1, 3);
  dot(ctx, x + 3, y + 4, P.mtn1, 3, 1);

  // 반짝임
  if (Math.floor(frame * 0.2) % 3 === 0) {
    dot(ctx, x + 3, y + 2, P.white, 1, 1);
  }
}

// 8. 플레이어 (마리오 스타일)
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  py: number, img: HTMLImageElement | null,
  frame: number, isStep2: boolean, grounded: boolean,
  invincible: boolean, starMode: boolean
) {
  if (invincible && !starMode && Math.floor(frame / 4) % 2 === 0) return;

  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const scaleY = grounded ? (1 - Math.abs(Math.sin(frame * 0.25)) * 0.04) : 1;
    const dh = Math.round(PLH * scaleY);
    ctx.drawImage(img, PLX, Math.round(py + PLH - dh), PLW, dh);
    ctx.restore();
    return;
  }

  // 마리오 스타일 도트 캐릭터
  const legF = Math.floor(frame / 7) % 4;
  let bodyC = isStep2 ? "#0066cc" : "#ff0000";  // 파란색 / 빨간색
  let skinC = "#ffcc99";
  let hairC = isStep2 ? "#333333" : "#8b4513";  // 검은색 / 갈색
  let shoeC = "#333333";
  let gloveC = "#ffff00";  // 노란 장갑

  if (starMode) {
    const hue = (frame * 15) % 360;
    bodyC = `hsl(${hue}, 100%, 50%)`;
    skinC = `hsl(${(hue + 60) % 360}, 100%, 70%)`;
    hairC = `hsl(${(hue + 120) % 360}, 100%, 50%)`;
  }

  // 그림자
  if (grounded) {
    dot(ctx, PLX + 1, GY + 1, P.shadow, PLW - 2, 1);
  }

  // 머리
  dot(ctx, PLX + 3, py, skinC, 7, 6);
  dot(ctx, PLX + 2, py + 1, skinC, 9, 4);

  // 머리카락
  dot(ctx, PLX + 3, py, hairC, 7, 2);
  dot(ctx, PLX + 2, py + 1, hairC, 2, 2);
  dot(ctx, PLX + 9, py + 1, hairC, 2, 2);

  // 눈
  dot(ctx, PLX + 4, py + 2, P.black, 1, 2);
  dot(ctx, PLX + 8, py + 2, P.black, 1, 2);
  dot(ctx, PLX + 4, py + 2, P.white, 1, 1);
  dot(ctx, PLX + 8, py + 2, P.white, 1, 1);

  // 입
  dot(ctx, PLX + 5, py + 4, P.black, 3, 1);

  // 몸통
  dot(ctx, PLX + 2, py + 6, bodyC, 9, 5);
  dot(ctx, PLX + 3, py + 7, bodyC, 7, 3);

  // 장갑 (팔)
  const armSwing = legF < 2 ? 1 : -1;
  dot(ctx, PLX, py + 7 + armSwing, gloveC, 2, 2);
  dot(ctx, PLX + 11, py + 7 - armSwing, gloveC, 2, 2);
  dot(ctx, PLX + 1, py + 8 + armSwing, bodyC, 1, 1);
  dot(ctx, PLX + 12, py + 8 - armSwing, bodyC, 1, 1);

  // 다리
  if (grounded) {
    if (legF === 0) {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 3, py + 14, shoeC, 3, 2);
      dot(ctx, PLX + 7, py + 13, shoeC, 4, 2);
    } else if (legF === 1) {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 3, py + 13, shoeC, 4, 2);
      dot(ctx, PLX + 7, py + 14, shoeC, 3, 2);
    } else if (legF === 2) {
      dot(ctx, PLX + 2, py + 11, bodyC, 4, 4);
      dot(ctx, PLX + 8, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 2, py + 14, shoeC, 4, 2);
      dot(ctx, PLX + 8, py + 13, shoeC, 3, 2);
    } else {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 3, py + 13, shoeC, 3, 2);
      dot(ctx, PLX + 7, py + 14, shoeC, 4, 2);
    }
  } else {
    // 점프 중
    dot(ctx, PLX + 3, py + 11, bodyC, 3, 2);
    dot(ctx, PLX + 7, py + 11, bodyC, 3, 2);
    dot(ctx, PLX + 3, py + 12, shoeC, 3, 1);
    dot(ctx, PLX + 7, py + 12, shoeC, 3, 1);
  }
}

// ── 게임 로직 ──────────────────────────────────────────────────────────────────

function isColliding(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number, margin = 0) {
  return x1 + w1 - margin > x2 && x1 + margin < x2 + w2 && y1 + h1 - margin > y2 && y1 + margin < y2 + h2;
}

function formatDist(score: number) {
  const km = Math.floor(score / 1000);
  const m = score % 1000;
  return `${km}.${String(m).padStart(3, "0")} km`;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<GameStatus>("idle");
  const stepRef = useRef<1 | 2>(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const invincibleRef = useRef(false);
  const invTimerRef = useRef<NodeJS.Timeout | null>(null);
  const starModeRef = useRef(false);
  const starTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const spriteIdRef = useRef(0);
  const spritesRef = useRef<Sprite[]>([]);
  const groundOffRef = useRef(0);
  const hillOffRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);

  const playerYRef = useRef(GY - PLH);
  const playerVYRef = useRef(0);
  const groundedRef = useRef(true);

  const imgsRef = useRef<Record<string, HTMLImageElement | null>>({});
  const effectsRef = useRef<FloatEffect[]>([]);
  const effectIdRef = useRef(0);

  const [status, setStatus] = useState<GameStatus>("idle");
  const [step, setStep] = useState<1 | 2>(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    [IMG_YEONGSEO, IMG_JINSEONG, IMG_OBSTACLE, IMG_GEL].forEach(async (src) => {
      imgsRef.current[src] = await loadImg(src);
    });
  }, []);

  const jump = useCallback(() => {
    if (!groundedRef.current || statusRef.current !== "playing") return;
    playerVYRef.current = JUMP_VY;
    groundedRef.current = false;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  const triggerStar = useCallback(() => {
    starModeRef.current = true;
    if (starTimerRef.current) clearTimeout(starTimerRef.current);
    starTimerRef.current = setTimeout(() => { starModeRef.current = false; }, STAR_MS);
  }, []);

  const spawnLeaves = useCallback((x: number, y: number) => {
    const colors = [P.mtn3, P.block1, P.coin, P.coinHL];
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x, y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -1.5 - Math.random() * 2,
        life: 30 + Math.floor(Math.random() * 20),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1 + Math.floor(Math.random() * 2),
      });
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const cfg = STEP_CONFIG[stepRef.current];
    const target = stepRef.current === 1 ? STEP1_TARGET : STEP2_TARGET;
    frameRef.current++;
    const fc = frameRef.current;

    scoreRef.current = Math.min(scoreRef.current + cfg.scorePerFrame, target);
    if (scoreRef.current >= target) {
      if (stepRef.current === 1) {
        statusRef.current = "step_clear";
        setScore(target); setStatus("step_clear");
        cancelAnimationFrame(rafRef.current); return;
      } else {
        cancelAnimationFrame(rafRef.current);
        onComplete(); return;
      }
    }

    if (!groundedRef.current) {
      playerVYRef.current = Math.min(playerVYRef.current + GRAVITY, MAX_FALL);
      playerYRef.current += playerVYRef.current;
      if (playerYRef.current >= GY - PLH) {
        playerYRef.current = GY - PLH;
        playerVYRef.current = 0;
        groundedRef.current = true;
      }
    }

    const currentSpeed = starModeRef.current ? cfg.scrollSpeed * 1.8 : cfg.scrollSpeed;
    groundOffRef.current += currentSpeed;
    hillOffRef.current += currentSpeed;

    spritesRef.current = spritesRef.current
      .map((s) => ({ ...s, x: s.x - currentSpeed }))
      .filter((s) => s.x > -OBW - 4);

    if (fc % Math.floor(cfg.spawnInterval / (starModeRef.current ? 1.5 : 1)) === 0) {
      const isStep2 = stepRef.current === 2;
      let type: SpawnType = "obstacle";
      const rand = Math.random();
      if (rand < cfg.itemChance) {
        if (isStep2 && Math.random() < 0.15) type = "super_item";
        else type = "item";
      } else {
        if (isStep2 && Math.random() < 0.35) type = "obstacle2";
        else type = "obstacle";
      }
      spritesRef.current.push({
        id: spriteIdRef.current++,
        x: CW + 4,
        type,
      });
    }

    const py = playerYRef.current;
    for (let i = spritesRef.current.length - 1; i >= 0; i--) {
      const s = spritesRef.current[i];
      if (s.x > CW) continue;
      
      if (s.type === "obstacle" || s.type === "obstacle2") {
        const isObstacle2 = s.type === "obstacle2";
        const oy = isObstacle2 ? GY - OBH - 6 : GY - OBH;
        
        if (isColliding(PLX, py, PLW, PLH, s.x, oy, OBW, OBH)) {
          if (starModeRef.current) {
            // 별 먹은 상태면 장애물 파괴 & 보너스 점수
            scoreRef.current = Math.min(scoreRef.current + 300, target);
            spritesRef.current.splice(i, 1);
            effectsRef.current.push({ id: effectIdRef.current++, text: "KICK! +300", x: s.x, y: oy - 10, life: 40 });
            spawnLeaves(s.x + OBW / 2, oy);
          } else if (!invincibleRef.current) {
            // 맞음
            livesRef.current--;
            setLives(livesRef.current);
            spritesRef.current.splice(i, 1);
            triggerInvincible();
            spawnLeaves(s.x + OBW / 2, oy);
            if (livesRef.current <= 0) {
              statusRef.current = "gameover"; setStatus("gameover");
              cancelAnimationFrame(rafRef.current); return;
            }
          }
        }
      } else if (s.type === "item" || s.type === "super_item") {
        const iy = GY - ITH - 4;
        if (isColliding(PLX, py, PLW, PLH, s.x, iy, ITW, ITH, 1)) {
          if (s.type === "super_item") {
            triggerStar();
            effectsRef.current.push({ id: effectIdRef.current++, text: "SUPER STAR!", x: PLX, y: py - 10, life: 60 });
          } else {
            scoreRef.current = Math.min(scoreRef.current + GEL_BONUS, target);
            effectsRef.current.push({ id: effectIdRef.current++, text: "+0.5km ★", x: PLX + PLW / 2, y: py - 2, life: 45 });
          }
          spritesRef.current.splice(i, 1);
          spawnLeaves(s.x + ITW / 2, iy);
        }
      }
    }

    particlesRef.current = particlesRef.current
      .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, life: p.life - 1 }))
      .filter((p) => p.life > 0);

    effectsRef.current = effectsRef.current
      .map((e) => ({ ...e, y: e.y - 0.28, life: e.life - 1 }))
      .filter((e) => e.life > 0);

    ctx.clearRect(0, 0, CW, CH);

    drawSky(ctx);
    drawClouds(ctx, fc);
    drawMountains(ctx, hillOffRef.current);
    drawBlockPlatforms(ctx, hillOffRef.current);
    drawTeaField(ctx, groundOffRef.current);

    for (const s of spritesRef.current) {
      if (s.type === "obstacle") drawObstacle(ctx, Math.round(s.x), imgsRef.current[IMG_OBSTACLE]);
      else drawGel(ctx, Math.round(s.x), imgsRef.current[IMG_GEL], fc);
    }

    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life / 50;
      dot(ctx, Math.round(p.x), Math.round(p.y), p.color, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    const pImg = imgsRef.current[stepRef.current === 1 ? IMG_YEONGSEO : IMG_JINSEONG];
    drawPlayer(
      ctx, Math.round(playerYRef.current), pImg,
      fc, stepRef.current === 2, groundedRef.current,
      invincibleRef.current, starModeRef.current
    );

    for (const ef of effectsRef.current) {
      ctx.globalAlpha = ef.life / 45;
      pixelText(ctx, ef.text, Math.round(ef.x), Math.round(ef.y), P.uiGold, 4, "center");
    }
    ctx.globalAlpha = 1;

    if (fc % 10 === 0) setScore(scoreRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [triggerInvincible, spawnLeaves]);

  const startGame = useCallback((targetStep: 1 | 2) => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
    stepRef.current = targetStep; statusRef.current = "playing";
    scoreRef.current = 0; livesRef.current = MAX_LIVES;
    invincibleRef.current = false; frameRef.current = 0;
    spritesRef.current = []; groundOffRef.current = 0; hillOffRef.current = 0;
    playerYRef.current = GY - PLH; playerVYRef.current = 0; groundedRef.current = true;
    effectsRef.current = []; particlesRef.current = [];
    setStep(targetStep); setStatus("playing"); setScore(0); setLives(MAX_LIVES);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleStep2Start = useCallback(() => startGame(2), [startGame]);
  const handleRetry = useCallback(() => startGame(stepRef.current), [startGame]);
  const handleFinalClear = useCallback(() => onComplete(), [onComplete]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
  }, []);

  const isPlaying = ["playing", "gameover", "step_clear", "cleared"].includes(status);
  const target = step === 1 ? STEP1_TARGET : STEP2_TARGET;
  const pct = Math.min(100, Math.round((score / target) * 100));

  const pxFont: React.CSSProperties = {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
  };

  const popupBase: React.CSSProperties = {
    background: "linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%)",
    borderRadius: 0,
    padding: "18px 22px",
    textAlign: "center",
    animation: "s11-popup 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards",
    maxWidth: 260,
    ...pxFont,
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={target}
      hintText="스페이스바·클릭·터치로 점프! 장애물 피하고 녹차 잎 먹기 🍵"
      showProgress={false}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes s11-popup {
          0%   { transform: scale(0.6) translateY(6px); opacity: 0; }
          65%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes s11-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes s11-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-3px); }
        }
        @keyframes s11-sparkle {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.5; transform:scale(1.4); }
        }
        .s11-canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
        .s11-btn {
          cursor: pointer;
          transition: transform 0.06s, box-shadow 0.06s;
        }
        .s11-btn:active {
          transform: translate(2px,2px) !important;
          box-shadow: none !important;
        }
        .s11-hud-heart { animation: s11-float 1.2s ease-in-out infinite; }
      `}</style>

      <div className="flex-1 flex flex-col items-center px-3 py-2 gap-3">
        {!started && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div
              style={{
                background: "linear-gradient(135deg, #4a90e2 0%, #87ceeb 100%)",
                padding: "22px 20px",
                maxWidth: 320,
                width: "100%",
                boxShadow: "4px 4px 0 #2d5016, 8px 8px 0 #6ba547",
                ...pxFont,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: "0.52rem", color: "#ffd700", marginBottom: 4, letterSpacing: "0.04em" }}>
                  ★ STAGE 11 ★
                </div>
                <div style={{ fontSize: "0.68rem", color: "#ffffff", lineHeight: 1.9 }}>
                  녹차 마을 마라톤
                </div>
                <div style={{ fontSize: "0.44rem", color: "#c8e6c9", marginTop: 2 }}>
                  🍵 TEA FIELD MARATHON 🍵
                </div>
              </div>

              <div style={{ display: "flex", gap: 3, justifyContent: "center", marginBottom: 12 }}>
                {["#ff0000", "#ffd700", "#6ba547", "#0066cc", "#c8e6c9"].map((c, i) => (
                  <div key={i} style={{ width: 5, height: 5, background: c, borderRadius: 0 }} />
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                {[
                  { icon: "♀", name: "영서", dist: "10.000 km", bg: "#ffe6e6", bd: "#ff0000", tc: "#ff0000" },
                  { icon: "♂", name: "진성", dist: "42.195 km", bg: "#e6f2ff", bd: "#0066cc", tc: "#0066cc" },
                ].map((p) => (
                  <div key={p.name} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: p.bg, padding: "5px 10px",
                    boxShadow: `2px 2px 0 ${p.bd}44`,
                  }}>
                    <span style={{ fontSize: "0.65rem", color: p.tc }}>{p.icon}</span>
                    <span style={{ fontSize: "0.50rem", color: "#333", flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: "0.52rem", color: p.tc, fontWeight: "bold" }}>{p.dist}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "5px 10px", background: "#ffd700",
                  boxShadow: `2px 2px 0 #ffed4e66`,
                }}>
                  <span style={{ fontSize: "0.50rem", color: "#333" }}>★ TOTAL</span>
                  <span style={{ fontSize: "0.52rem", color: "#333", fontWeight: "bold" }}>52.195 km</span>
                </div>
              </div>

              <div style={{ fontSize: "0.42rem", color: "#ffffff", lineHeight: 2.2, textAlign: "center", marginBottom: 16 }}>
                [SPACE] / CLICK / TOUCH → JUMP<br />
                🌿 AVOID ENEMIES &nbsp;·&nbsp; 🍃 COLLECT LEAVES
              </div>

              <button
                className="s11-btn"
                onClick={() => { setStarted(true); startGame(1); }}
                style={{
                  width: "100%",
                  background: "#ffd700",
                  color: "#333",
                  border: "none",
                  padding: "11px 0",
                  fontSize: "0.60rem",
                  boxShadow: `3px 3px 0 #ffed4e`,
                  letterSpacing: "0.04em",
                  ...pxFont,
                }}
              >
                ▶ START GAME
              </button>
            </div>
          </div>
        )}

        {started && isPlaying && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div
              style={{
                width: "100%", maxWidth: CW * PX,
                background: "linear-gradient(135deg, #4a90e2, #87ceeb)",
                padding: "6px 10px",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "3px 3px 0 #6ba547",
                ...pxFont,
              }}
            >
              <div style={{
                fontSize: "0.40rem",
                color: step === 1 ? "#ff0000" : "#0066cc",
                background: step === 1 ? "#ffe6e6" : "#e6f2ff",
                padding: "3px 7px",
                boxShadow: `1px 1px 0 ${step === 1 ? "#ff0000" : "#0066cc"}88`,
                flexShrink: 0,
              }}>
                {step === 1 ? "P1 영서♀" : "P2 진성♂"}
              </div>

              <div style={{ fontSize: "0.46rem", color: "#ffffff", flexShrink: 0 }}>
                {formatDist(score)}
              </div>

              <div style={{
                flex: 1, height: 7,
                background: "#ffffff",
                boxShadow: "inset 1px 1px 0 #c8e6c9",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: step === 1
                    ? "repeating-linear-gradient(90deg,#ff0000 0 3px,#cc0000 3px 6px)"
                    : "repeating-linear-gradient(90deg,#0066cc 0 3px,#0044aa 3px 6px)",
                  transition: "width 200ms steps(16)",
                }} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.34rem", color: "#333",
                }}>
                  {pct}%
                </div>
              </div>

              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span
                    key={i}
                    className={i < lives ? "s11-hud-heart" : ""}
                    style={{
                      fontSize: "0.85rem",
                      opacity: i < lives ? 1 : 0.2,
                      filter: i < lives ? "none" : "grayscale(1)",
                      animationDelay: `${i * 0.2}s`,
                      display: "inline-block",
                    }}
                  >
                    {i < lives ? "♥" : "♡"}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                position: "relative", width: "100%", maxWidth: CW * PX,
                cursor: "pointer", touchAction: "none",
                boxShadow: "4px 4px 0 #6ba547, 8px 8px 0 #a5d6a7",
              }}
              onClick={() => jump()}
              onTouchStart={(e) => { e.preventDefault(); jump(); }}
            >
              <canvas
                ref={canvasRef}
                width={CW} height={CH}
                className="s11-canvas"
                style={{ display: "block", width: "100%", height: "auto" }}
              />

              {status === "step_clear" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,250,240,0.82)" }}>
                  <div style={{ ...popupBase, boxShadow: "4px 4px 0 #6ba547" }}>
                    <div style={{ fontSize: "0.55rem", color: "#ff0000", marginBottom: 8, animation: "s11-sparkle 1s infinite" }}>
                      ★ STEP 1 CLEAR ★
                    </div>
                    <div style={{ fontSize: "0.44rem", color: "#333", lineHeight: 2.2, marginBottom: 14 }}>
                      영서 10km 완주!<br />
                      <span style={{ color: "#0066cc" }}>진성이에게 바통 터치~</span>
                    </div>
                    <button
                      className="s11-btn"
                      onClick={(e) => { e.stopPropagation(); handleStep2Start(); }}
                      style={{
                        background: "#0066cc",
                        color: "#ffffff", border: "none", padding: "9px 16px",
                        fontSize: "0.44rem", boxShadow: "2px 2px 0 #003d99",
                        width: "100%", ...pxFont,
                      }}
                    >
                      ▶ 진성이 달리기 시작!
                    </button>
                  </div>
                </div>
              )}

              {status === "gameover" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,250,240,0.82)" }}>
                  <div style={{ ...popupBase, boxShadow: "4px 4px 0 #ef5350" }}>
                    <div style={{ fontSize: "0.55rem", color: "#ef5350", marginBottom: 8, animation: "s11-blink 0.9s infinite" }}>
                      GAME OVER
                    </div>
                    <div style={{ fontSize: "0.42rem", color: "#333", lineHeight: 2.2, marginBottom: 14 }}>
                      {step === 1 ? "영서" : "진성이"}가<br />
                      <span style={{ color: "#ffd700" }}>{formatDist(score)}</span> 달렸어요
                    </div>
                    <button
                      className="s11-btn"
                      onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                      style={{
                        background: "#ef5350",
                        color: "#ffffff", border: "none", padding: "9px 16px",
                        fontSize: "0.44rem", boxShadow: "2px 2px 0 #b71c1c",
                        width: "100%", ...pxFont,
                      }}
                    >
                      ▶ RETRY
                    </button>
                  </div>
                </div>
              )}


            </div>

            {status === "playing" && (
              <div style={{ ...pxFont, fontSize: "0.36rem", color: "#2d5016", textAlign: "center", opacity: 0.85 }}>
                [SPACE] / CLICK / TOUCH → JUMP &nbsp;·&nbsp; 🌿 avoid &nbsp;·&nbsp; 🍃 collect
              </div>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
