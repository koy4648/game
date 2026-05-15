/*
 * Stage 11 - 보성 녹차마라톤: 2D 픽셀 아트 횡스크롤 달리기 게임
 *
 * 디자인 컨셉: 레트로 도트 픽셀 아트 × 보성 녹차밭
 *   - canvas-image-rendering: pixelated (저해상도 업스케일)
 *   - 모든 배경/캐릭터/UI를 픽셀 단위 fillRect 도트로 그림
 *   - 팔레트: 녹차 그린 계열 + 레트로 베이지/브라운 + 하늘 블루
 *   - HUD: 픽셀 테두리 박스, 도트 하트, 레트로 폰트
 *   - 팝업: 픽셀 아트 대화창 스타일 (8px 격자 테두리)
 *
 * Step 1: 영서 10km  (내부 점수 10000)
 * Step 2: 진성 42.195km (내부 점수 42195)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type GameStatus = "idle" | "playing" | "gameover" | "step_clear" | "cleared";
type SpawnType  = "obstacle" | "item";

interface Sprite {
  id: number;
  x: number;
  type: SpawnType;
}

interface FloatEffect {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
}

// ─── 저해상도 캔버스 상수 (픽셀 아트용 작은 해상도 → CSS로 업스케일) ──────
const PX = 3;            // 1 도트 = 3 CSS px (업스케일 배율)
const CW  = 240;         // 캔버스 내부 너비 (도트)
const CH  = 80;          // 캔버스 내부 높이 (도트)
const GY  = 58;          // 바닥 y (도트)

const PLW = 14;          // 플레이어 너비 (도트)
const PLH = 18;          // 플레이어 높이 (도트)
const PLX = 22;          // 플레이어 고정 x (도트)

const OBW = 10;          // 장애물 너비
const OBH = 10;          // 장애물 높이
const ITW = 8;           // 아이템 너비
const ITH = 8;           // 아이템 높이

const GRAVITY   = 0.22;
const JUMP_VY   = -4.8;
const MAX_FALL  = 5;

const STEP1_TARGET = 10000;
const STEP2_TARGET = 42195;
const GEL_BONUS    = 500;
const MAX_LIVES    = 3;
const INVINCIBLE_MS = 1500;

const STEP_CONFIG = {
  1: { scrollSpeed: 1.5, spawnInterval: 90,  itemChance: 0.28, scorePerFrame: 3 },
  2: { scrollSpeed: 2.0, spawnInterval: 72,  itemChance: 0.30, scorePerFrame: 4 },
} as const;

// 이미지 경로
const IMG_YEONGSEO = "/webdev-static-assets/caricature-run-yeongseo.png";
const IMG_JINSEONG  = "/webdev-static-assets/caricature-run-jinseong.png";
const IMG_OBSTACLE  = "/webdev-static-assets/obstacle-bush.png";
const IMG_GEL       = "/webdev-static-assets/item-energy-gel.png";

// ─── 보성 녹차밭 픽셀 팔레트 ─────────────────────────────────────────────────
const PAL = {
  // 하늘
  sky1:      "#b8e4f9",   // 연하늘
  sky2:      "#7ec8e3",   // 하늘
  sky3:      "#d4f0ff",   // 구름 밝은 면
  cloud:     "#f0faff",
  // 녹차밭
  tea1:      "#2d6a1f",   // 진한 녹차
  tea2:      "#3d8a2a",   // 녹차
  tea3:      "#5aaa3a",   // 밝은 녹차
  tea4:      "#7acc50",   // 연녹차
  // 흙/길
  path:      "#c8a46a",   // 황토 길
  pathDark:  "#a07840",   // 진한 황토
  pathLine:  "#e8c888",   // 길 줄무늬
  // 나무/언덕
  hill1:     "#1a4a10",
  hill2:     "#2a6018",
  hill3:     "#3a7a22",
  // 픽셀 UI
  uiBg:      "#1a2e0a",   // UI 배경 (진한 녹차)
  uiBorder:  "#5aaa3a",   // UI 테두리
  uiText:    "#e8f8d0",   // UI 텍스트
  uiGold:    "#f8d840",   // 골드 강조
  uiRed:     "#e84040",   // 빨강 (게임오버)
  uiPink:    "#f880a0",   // 핑크
  // 기타
  white:     "#ffffff",
  black:     "#000000",
  shadow:    "#00000044",
};

// ─── 도트 드로우 헬퍼 ────────────────────────────────────────────────────────
// 픽셀 단위 좌표를 실제 캔버스 px로 변환해 fillRect
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// 픽셀 테두리 박스 (8비트 스타일)
function pixelBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bg: string, border: string, borderW = 1
) {
  dot(ctx, x, y, bg, w, h);
  // 테두리
  dot(ctx, x, y, border, w, borderW);           // 상단
  dot(ctx, x, y + h - borderW, border, w, borderW); // 하단
  dot(ctx, x, y, border, borderW, h);           // 좌측
  dot(ctx, x + w - borderW, y, border, borderW, h); // 우측
}

// 텍스트 (캔버스 내장 폰트 - 픽셀 느낌)
function pixelText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color: string, size = 5, align: CanvasTextAlign = "left"
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.imageSmoothingEnabled = false;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── 픽셀 아트 드로우 함수들 ─────────────────────────────────────────────────

// 하늘 + 구름
function drawSky(ctx: CanvasRenderingContext2D, cloudOff: number) {
  // 하늘 그라디언트 (도트 수평 줄로 표현)
  const skyColors = [
    PAL.sky2, PAL.sky2, PAL.sky1, PAL.sky1, PAL.sky1,
    PAL.sky1, PAL.sky1, PAL.sky1, PAL.sky1, PAL.sky1,
    PAL.sky1, PAL.sky1, PAL.sky1, PAL.sky1, PAL.sky1,
  ];
  for (let row = 0; row < GY; row++) {
    const c = skyColors[Math.min(row, skyColors.length - 1)];
    dot(ctx, 0, row, c, CW, 1);
  }

  // 구름 (픽셀 도트)
  const clouds = [
    { x: 30,  y: 6,  w: 18, h: 5 },
    { x: 90,  y: 10, w: 14, h: 4 },
    { x: 160, y: 5,  w: 22, h: 6 },
    { x: 210, y: 12, w: 12, h: 3 },
  ];
  for (const cl of clouds) {
    const cx = ((cl.x - cloudOff % CW) + CW) % CW;
    // 구름 도트 패턴
    dot(ctx, cx,       cl.y + 2, PAL.cloud, cl.w,     cl.h - 2);
    dot(ctx, cx + 2,   cl.y,     PAL.cloud, cl.w - 4, 2);
    dot(ctx, cx + 1,   cl.y + 1, PAL.sky3,  cl.w - 2, 1);
    // 구름이 화면 끝을 넘어가면 반대쪽에도 그리기
    if (cx + cl.w > CW) {
      const cx2 = cx - CW;
      dot(ctx, cx2,       cl.y + 2, PAL.cloud, cl.w,     cl.h - 2);
      dot(ctx, cx2 + 2,   cl.y,     PAL.cloud, cl.w - 4, 2);
    }
  }
}

// 원거리 산/언덕 (픽셀 실루엣)
function drawHills(ctx: CanvasRenderingContext2D, off: number) {
  // 언덕 프로파일 (y 오프셋 배열, 각 x 도트마다)
  const profile = [8,7,6,5,4,4,3,3,3,4,5,6,7,8,9,10,11,12,12,11,10,9,8,7,6,5,4,3,2,2,2,3,4,5,6,7,8,9,10,10];
  const pw = profile.length;
  for (let x = 0; x < CW; x++) {
    const px = ((x + Math.round(off)) % pw + pw) % pw;
    const topY = GY - 14 - profile[px];
    // 언덕 3레이어
    dot(ctx, x, topY,      PAL.hill1, 1, GY - topY);
    dot(ctx, x, topY,      PAL.hill2, 1, 2);
    dot(ctx, x, topY + 2,  PAL.hill3, 1, 1);
  }
}

// 녹차밭 줄 (계단식 차나무 행)
function drawTeaField(ctx: CanvasRenderingContext2D, off: number) {
  // 바닥 기본색
  dot(ctx, 0, GY, PAL.path, CW, CH - GY);

  // 황토 길 (중앙 주자 경로)
  dot(ctx, 0, GY,     PAL.path,     CW, 4);
  dot(ctx, 0, GY + 1, PAL.pathDark, CW, 1);

  // 길 줄무늬 (스크롤)
  const stripeOff = Math.round(off) % 12;
  for (let x = -stripeOff; x < CW; x += 12) {
    dot(ctx, x, GY + 2, PAL.pathLine, 6, 1);
  }

  // 녹차밭 (바닥 아래 영역)
  dot(ctx, 0, GY + 4, PAL.tea1, CW, CH - GY - 4);

  // 차나무 행 (픽셀 도트 패턴)
  const rowOff = Math.round(off * 0.8) % 16;
  for (let x = -rowOff; x < CW; x += 16) {
    // 차나무 픽셀 모양
    dot(ctx, x,     GY + 5, PAL.tea2, 6, 3);
    dot(ctx, x + 1, GY + 4, PAL.tea3, 4, 1);
    dot(ctx, x + 2, GY + 3, PAL.tea4, 2, 1);
    dot(ctx, x + 8, GY + 6, PAL.tea2, 5, 2);
    dot(ctx, x + 9, GY + 5, PAL.tea3, 3, 1);
  }

  // 원거리 녹차밭 (더 작고 빠르게 스크롤)
  const farOff = Math.round(off * 0.4) % 10;
  for (let x = -farOff; x < CW; x += 10) {
    dot(ctx, x,     GY - 4, PAL.hill2, 4, 2);
    dot(ctx, x + 1, GY - 5, PAL.hill3, 2, 1);
  }
}

// 장애물 (픽셀 덤불/돌)
function drawObstacle(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null) {
  const y = GY - OBH;
  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, OBW, OBH);
    ctx.restore();
    return;
  }
  // 픽셀 아트 덤불
  dot(ctx, x + 1, y + 5, PAL.tea1, 8, 5);
  dot(ctx, x,     y + 6, PAL.tea1, 10, 4);
  dot(ctx, x + 2, y + 3, PAL.tea2, 6, 4);
  dot(ctx, x + 3, y + 2, PAL.tea3, 4, 3);
  dot(ctx, x + 4, y + 1, PAL.tea4, 2, 2);
  dot(ctx, x + 1, y + 4, PAL.tea3, 2, 1);
  dot(ctx, x + 7, y + 4, PAL.tea3, 2, 1);
  // 그림자
  dot(ctx, x + 1, GY, PAL.shadow, 8, 1);
}

// 에너지 겔 아이템 (픽셀 캡슐)
function drawGel(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null, frame: number) {
  const y = GY - ITH - 2 - Math.round(Math.sin(frame * 0.12) * 1.5);
  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, ITW, ITH);
    ctx.restore();
    return;
  }
  // 픽셀 아트 캡슐 (골드)
  dot(ctx, x + 1, y,     PAL.uiGold, 6, 1);
  dot(ctx, x,     y + 1, PAL.uiGold, 8, 6);
  dot(ctx, x + 1, y + 7, PAL.uiGold, 6, 1);
  // 하이라이트
  dot(ctx, x + 1, y + 1, PAL.white,  2, 2);
  // 번개 기호
  dot(ctx, x + 3, y + 2, PAL.black,  1, 4);
  dot(ctx, x + 4, y + 2, PAL.black,  2, 2);
  dot(ctx, x + 2, y + 4, PAL.black,  2, 2);
}

// 플레이어 (픽셀 도트 캐릭터)
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  py: number,
  img: HTMLImageElement | null,
  frame: number,
  isStep2: boolean,
  grounded: boolean
) {
  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // 달리기 애니메이션: 착지 시 살짝 스쿼시
    const scaleY = grounded ? (1 - Math.abs(Math.sin(frame * 0.25)) * 0.05) : 1;
    const drawH  = Math.round(PLH * scaleY);
    const drawY  = Math.round(py + PLH - drawH);
    ctx.drawImage(img, PLX, drawY, PLW, drawH);
    ctx.restore();
    return;
  }

  // 픽셀 아트 폴백 캐릭터
  const legFrame = Math.floor(frame / 8) % 2;
  const color    = isStep2 ? "#4488ff" : "#ff88aa";
  const skinColor = "#ffcc88";

  // 몸통
  dot(ctx, PLX + 4, py + 4,  color,     6, 8);
  // 머리
  dot(ctx, PLX + 4, py,      skinColor, 6, 4);
  dot(ctx, PLX + 3, py + 1,  skinColor, 8, 3);
  // 눈
  dot(ctx, PLX + 5, py + 1,  PAL.black, 1, 1);
  dot(ctx, PLX + 8, py + 1,  PAL.black, 1, 1);
  // 다리 (애니메이션)
  if (legFrame === 0) {
    dot(ctx, PLX + 4, py + 12, color, 2, 4);
    dot(ctx, PLX + 8, py + 14, color, 2, 2);
  } else {
    dot(ctx, PLX + 4, py + 14, color, 2, 2);
    dot(ctx, PLX + 8, py + 12, color, 2, 4);
  }
  // 팔
  dot(ctx, PLX + 2, py + 5,  color, 2, 3);
  dot(ctx, PLX + 10, py + 5, color, 2, 3);
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────
function formatDist(n: number): string {
  return (n / 1000).toFixed(3) + " km";
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function isColliding(
  px: number, py: number, pw: number, ph: number,
  sx: number, sy: number, sw: number, sh: number,
  margin = 2
): boolean {
  return (
    px + margin < sx + sw - margin &&
    px + pw - margin > sx + margin &&
    py + margin < sy + sh - margin &&
    py + ph - margin > sy + margin
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  const statusRef      = useRef<GameStatus>("idle");
  const stepRef        = useRef<1 | 2>(1);
  const scoreRef       = useRef(0);
  const livesRef       = useRef(MAX_LIVES);
  const invincibleRef  = useRef(false);
  const invTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef       = useRef(0);
  const spritesRef     = useRef<Sprite[]>([]);
  const spriteIdRef    = useRef(0);
  const groundOffRef   = useRef(0);
  const cloudOffRef    = useRef(0);
  const hillOffRef     = useRef(0);

  const playerYRef  = useRef(GY - PLH);
  const playerVYRef = useRef(0);
  const groundedRef = useRef(true);

  const imgsRef     = useRef<Record<string, HTMLImageElement | null>>({});
  const effectsRef  = useRef<FloatEffect[]>([]);
  const effectIdRef = useRef(0);

  // React 상태
  const [status,  setStatus]  = useState<GameStatus>("idle");
  const [step,    setStep]    = useState<1 | 2>(1);
  const [score,   setScore]   = useState(0);
  const [lives,   setLives]   = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  // 이미지 로드
  useEffect(() => {
    [IMG_YEONGSEO, IMG_JINSEONG, IMG_OBSTACLE, IMG_GEL].forEach(async (src) => {
      imgsRef.current[src] = await loadImg(src);
    });
  }, []);

  // 점프
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

  // 무적
  const triggerInvincible = useCallback(() => {
    invincibleRef.current = true;
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
    invTimerRef.current = setTimeout(() => { invincibleRef.current = false; }, INVINCIBLE_MS);
  }, []);

  // ── 게임 루프 ──
  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const cfg    = STEP_CONFIG[stepRef.current];
    const target = stepRef.current === 1 ? STEP1_TARGET : STEP2_TARGET;
    frameRef.current++;
    const fc = frameRef.current;

    // 1) 점수
    scoreRef.current = Math.min(scoreRef.current + cfg.scorePerFrame, target);
    if (scoreRef.current >= target) {
      statusRef.current = stepRef.current === 1 ? "step_clear" : "cleared";
      setScore(target);
      setStatus(statusRef.current);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    // 2) 물리
    if (!groundedRef.current) {
      playerVYRef.current = Math.min(playerVYRef.current + GRAVITY, MAX_FALL);
      playerYRef.current += playerVYRef.current;
      if (playerYRef.current >= GY - PLH) {
        playerYRef.current = GY - PLH;
        playerVYRef.current = 0;
        groundedRef.current = true;
      }
    }

    // 3) 스크롤
    groundOffRef.current = (groundOffRef.current + cfg.scrollSpeed);
    cloudOffRef.current  = (cloudOffRef.current  + cfg.scrollSpeed * 0.15);
    hillOffRef.current   = (hillOffRef.current   + cfg.scrollSpeed * 0.35);

    // 4) 스프라이트 이동
    spritesRef.current = spritesRef.current
      .map((s) => ({ ...s, x: s.x - cfg.scrollSpeed }))
      .filter((s) => s.x > -OBW - 4);

    // 5) 스프라이트 생성
    if (fc % cfg.spawnInterval === 0) {
      spritesRef.current.push({
        id: spriteIdRef.current++,
        x: CW + 4,
        type: Math.random() < cfg.itemChance ? "item" : "obstacle",
      });
    }

    // 6) 충돌
    const py = playerYRef.current;
    for (let i = spritesRef.current.length - 1; i >= 0; i--) {
      const s = spritesRef.current[i];
      if (s.x > CW) continue;

      if (s.type === "obstacle") {
        const oy = GY - OBH;
        if (!invincibleRef.current && isColliding(PLX, py, PLW, PLH, s.x, oy, OBW, OBH)) {
          livesRef.current--;
          setLives(livesRef.current);
          spritesRef.current.splice(i, 1);
          triggerInvincible();
          if (livesRef.current <= 0) {
            statusRef.current = "gameover";
            setStatus("gameover");
            cancelAnimationFrame(rafRef.current);
            return;
          }
        }
      } else {
        const iy = GY - ITH - 2;
        if (isColliding(PLX, py, PLW, PLH, s.x, iy, ITW, ITH, 1)) {
          scoreRef.current = Math.min(scoreRef.current + GEL_BONUS, target);
          spritesRef.current.splice(i, 1);
          effectsRef.current.push({
            id: effectIdRef.current++,
            text: "+0.5km!",
            x: PLX + PLW / 2,
            y: py - 2,
            life: 40,
          });
        }
      }
    }

    // 7) 이펙트
    effectsRef.current = effectsRef.current
      .map((e) => ({ ...e, y: e.y - 0.3, life: e.life - 1 }))
      .filter((e) => e.life > 0);

    // ── 8) 렌더링 ──────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, CW, CH);

    // 배경
    drawSky(ctx, cloudOffRef.current);
    drawHills(ctx, hillOffRef.current);
    drawTeaField(ctx, groundOffRef.current);

    // 스프라이트
    for (const s of spritesRef.current) {
      if (s.type === "obstacle") {
        drawObstacle(ctx, Math.round(s.x), imgsRef.current[IMG_OBSTACLE]);
      } else {
        drawGel(ctx, Math.round(s.x), imgsRef.current[IMG_GEL], fc);
      }
    }

    // 플레이어
    const blinkOn = invincibleRef.current && Math.floor(fc / 4) % 2 === 0;
    if (!blinkOn) {
      const playerImg = imgsRef.current[stepRef.current === 1 ? IMG_YEONGSEO : IMG_JINSEONG];
      drawPlayer(ctx, Math.round(playerYRef.current), playerImg, fc, stepRef.current === 2, groundedRef.current);
    }

    // 이펙트 텍스트
    for (const ef of effectsRef.current) {
      const alpha = ef.life / 40;
      ctx.globalAlpha = alpha;
      pixelText(ctx, ef.text, Math.round(ef.x), Math.round(ef.y), PAL.uiGold, 4, "center");
      ctx.globalAlpha = 1;
    }

    // UI 업데이트
    if (fc % 10 === 0) setScore(scoreRef.current);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [triggerInvincible]);

  // ── 게임 시작 ──
  const startGame = useCallback((targetStep: 1 | 2) => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);

    stepRef.current      = targetStep;
    statusRef.current    = "playing";
    scoreRef.current     = 0;
    livesRef.current     = MAX_LIVES;
    invincibleRef.current = false;
    frameRef.current     = 0;
    spritesRef.current   = [];
    groundOffRef.current = 0;
    cloudOffRef.current  = 0;
    hillOffRef.current   = 0;
    playerYRef.current   = GY - PLH;
    playerVYRef.current  = 0;
    groundedRef.current  = true;
    effectsRef.current   = [];

    setStep(targetStep);
    setStatus("playing");
    setScore(0);
    setLives(MAX_LIVES);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleStep2Start = useCallback(() => startGame(2), [startGame]);
  const handleRetry      = useCallback(() => startGame(stepRef.current), [startGame]);
  const handleFinalClear = useCallback(() => onComplete(), [onComplete]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
  }, []);

  // ─── 렌더 ────────────────────────────────────────────────────────────────
  const isPlaying = status === "playing" || status === "gameover" || status === "step_clear" || status === "cleared";
  const target    = step === 1 ? STEP1_TARGET : STEP2_TARGET;
  const pct       = Math.min(100, Math.round((score / target) * 100));

  // 픽셀 아트 UI 공통 스타일
  const pixelFont: React.CSSProperties = {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    imageRendering: "pixelated",
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={target}
      hintText="스페이스바·클릭·터치로 점프! 장애물 피하고 에너지 겔 먹기 🍵"
      showProgress={false}
    >
      {/* 픽셀 폰트 로드 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        @keyframes s11-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes s11-popup {
          0%   { transform: scale(0.5) translateY(8px); opacity: 0; }
          60%  { transform: scale(1.06) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes s11-scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        .s11-canvas-wrap {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .s11-canvas-wrap canvas {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .s11-pixel-border {
          box-shadow:
            0 0 0 2px #1a2e0a,
            0 0 0 4px #5aaa3a,
            0 0 0 6px #1a2e0a,
            0 0 0 8px #3a7a22;
        }
        .s11-scanline::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.08) 2px,
            rgba(0,0,0,0.08) 4px
          );
          pointer-events: none;
          animation: s11-scanline 0.2s linear infinite;
        }
      `}</style>

      <div className="flex-1 flex flex-col items-center px-3 py-2 gap-3">

        {/* ── 시작 화면 ── */}
        {!started && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div
              style={{
                background: "#0a1a04",
                border: "none",
                borderRadius: 0,
                padding: "24px 20px",
                maxWidth: 340,
                width: "100%",
                ...pixelFont,
              }}
              className="s11-pixel-border"
            >
              {/* 타이틀 */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: "0.65rem", color: PAL.uiGold, marginBottom: 6, letterSpacing: "0.05em" }}>
                  ★ STAGE 11 ★
                </div>
                <div style={{ fontSize: "0.72rem", color: PAL.uiText, lineHeight: 1.8 }}>
                  보성 녹차마라톤
                </div>
                <div style={{ fontSize: "0.55rem", color: PAL.tea4, marginTop: 4 }}>
                  BOSEONG GREEN TEA MARATHON
                </div>
              </div>

              {/* 픽셀 구분선 */}
              <div style={{ height: 2, background: PAL.uiBorder, marginBottom: 14 }} />

              {/* 거리 정보 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {[
                  { icon: "♀", name: "영서", dist: "10.000 km", color: PAL.uiPink },
                  { icon: "♂", name: "진성", dist: "42.195 km", color: "#88aaff" },
                ].map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#162a08",
                      padding: "5px 8px",
                      border: `1px solid ${p.color}44`,
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: p.color }}>{p.icon}</span>
                    <span style={{ fontSize: "0.52rem", color: PAL.uiText, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: "0.55rem", color: p.color }}>{p.dist}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 8px",
                    background: "#1e3a0c",
                    border: `1px solid ${PAL.uiGold}44`,
                  }}
                >
                  <span style={{ fontSize: "0.52rem", color: PAL.uiGold }}>TOTAL</span>
                  <span style={{ fontSize: "0.55rem", color: PAL.uiGold }}>52.195 km</span>
                </div>
              </div>

              {/* 조작 안내 */}
              <div
                style={{
                  fontSize: "0.48rem",
                  color: PAL.tea4,
                  lineHeight: 2,
                  marginBottom: 16,
                  textAlign: "center",
                  letterSpacing: "0.02em",
                }}
              >
                [SPACE] / CLICK / TOUCH → JUMP<br />
                AVOID BUSHES · COLLECT GEL ⚡
              </div>

              {/* 시작 버튼 */}
              <button
                onClick={() => { setStarted(true); startGame(1); }}
                style={{
                  width: "100%",
                  background: PAL.uiBorder,
                  color: "#0a1a04",
                  border: "none",
                  padding: "10px 0",
                  fontSize: "0.62rem",
                  cursor: "pointer",
                  ...pixelFont,
                  letterSpacing: "0.05em",
                  boxShadow: `3px 3px 0 ${PAL.hill1}`,
                  transition: "transform 0.05s, box-shadow 0.05s",
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translate(3px,3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = `3px 3px 0 ${PAL.hill1}`; }}
              >
                ▶ START GAME
              </button>
            </div>
          </div>
        )}

        {/* ── 게임 플레이 영역 ── */}
        {started && isPlaying && (
          <div className="flex flex-col items-center gap-2 w-full">

            {/* HUD 바 */}
            <div
              style={{
                width: "100%",
                maxWidth: CW * PX,
                background: "#0a1a04",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...pixelFont,
              }}
              className="s11-pixel-border"
            >
              {/* 스텝 */}
              <div
                style={{
                  fontSize: "0.42rem",
                  color: step === 1 ? PAL.uiPink : "#88aaff",
                  background: "#162a08",
                  padding: "3px 6px",
                  border: `1px solid ${step === 1 ? PAL.uiPink : "#88aaff"}66`,
                  flexShrink: 0,
                  letterSpacing: "0.03em",
                }}
              >
                {step === 1 ? "P1:영서" : "P2:진성"}
              </div>

              {/* 거리 */}
              <div style={{ fontSize: "0.48rem", color: PAL.uiGold, flexShrink: 0 }}>
                {formatDist(score)}
              </div>

              {/* 프로그레스 바 (픽셀 스타일) */}
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "#162a08",
                  border: `1px solid ${PAL.uiBorder}66`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    background: step === 1
                      ? `repeating-linear-gradient(90deg, ${PAL.tea3} 0 4px, ${PAL.tea4} 4px 8px)`
                      : `repeating-linear-gradient(90deg, #6688ff 0 4px, #88aaff 4px 8px)`,
                    transition: "width 200ms steps(20)",
                  }}
                />
              </div>

              {/* 목숨 하트 (픽셀) */}
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.7rem",
                      opacity: i < lives ? 1 : 0.2,
                      filter: i < lives ? "none" : "grayscale(1)",
                    }}
                  >
                    ♥
                  </span>
                ))}
              </div>
            </div>

            {/* 캔버스 래퍼 */}
            <div
              className="s11-canvas-wrap s11-scanline"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: CW * PX,
                cursor: "pointer",
                touchAction: "none",
              }}
              onClick={() => jump()}
              onTouchStart={(e) => { e.preventDefault(); jump(); }}
            >
              <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  imageRendering: "pixelated",
                }}
                className="s11-pixel-border"
              />

              {/* ── Step 1 클리어 팝업 ── */}
              {status === "step_clear" && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.65)",
                  }}
                >
                  <div
                    style={{
                      background: "#0a1a04",
                      padding: "16px 20px",
                      textAlign: "center",
                      animation: "s11-popup 0.35s ease-out forwards",
                      ...pixelFont,
                    }}
                    className="s11-pixel-border"
                  >
                    <div style={{ fontSize: "0.55rem", color: PAL.uiGold, marginBottom: 8, letterSpacing: "0.05em" }}>
                      ★ STEP 1 CLEAR ★
                    </div>
                    <div style={{ fontSize: "0.48rem", color: PAL.uiText, lineHeight: 2, marginBottom: 12 }}>
                      영서 10km 완주!<br />
                      <span style={{ color: PAL.uiPink }}>진성이에게 바통 터치!</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStep2Start(); }}
                      style={{
                        background: PAL.uiBorder,
                        color: "#0a1a04",
                        border: "none",
                        padding: "8px 16px",
                        fontSize: "0.45rem",
                        cursor: "pointer",
                        ...pixelFont,
                        boxShadow: `2px 2px 0 ${PAL.hill1}`,
                        letterSpacing: "0.03em",
                      }}
                    >
                      ▶ 진성이 달리기 시작
                    </button>
                  </div>
                </div>
              )}

              {/* ── 게임 오버 팝업 ── */}
              {status === "gameover" && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.70)",
                  }}
                >
                  <div
                    style={{
                      background: "#0a1a04",
                      padding: "14px 18px",
                      textAlign: "center",
                      animation: "s11-popup 0.35s ease-out forwards",
                      ...pixelFont,
                    }}
                    className="s11-pixel-border"
                  >
                    <div style={{ fontSize: "0.55rem", color: PAL.uiRed, marginBottom: 8, animation: "s11-blink 1s infinite" }}>
                      GAME OVER
                    </div>
                    <div style={{ fontSize: "0.42rem", color: PAL.uiText, lineHeight: 2, marginBottom: 12 }}>
                      {step === 1 ? "영서" : "진성이"}가<br />
                      <span style={{ color: PAL.uiGold }}>{formatDist(score)}</span> 달렸어요
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                      style={{
                        background: PAL.uiRed,
                        color: PAL.white,
                        border: "none",
                        padding: "8px 16px",
                        fontSize: "0.45rem",
                        cursor: "pointer",
                        ...pixelFont,
                        boxShadow: "2px 2px 0 #800000",
                        letterSpacing: "0.03em",
                      }}
                    >
                      ▶ RETRY
                    </button>
                  </div>
                </div>
              )}

              {/* ── 최종 클리어 팝업 ── */}
              {status === "cleared" && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.65)",
                  }}
                >
                  <div
                    style={{
                      background: "#0a1a04",
                      padding: "18px 22px",
                      textAlign: "center",
                      animation: "s11-popup 0.42s ease-out forwards",
                      ...pixelFont,
                    }}
                    className="s11-pixel-border"
                  >
                    <div style={{ fontSize: "0.60rem", color: PAL.uiGold, marginBottom: 6, letterSpacing: "0.06em" }}>
                      ★ MARATHON CLEAR ★
                    </div>
                    <div style={{ height: 1, background: PAL.uiBorder, marginBottom: 10 }} />
                    <div style={{ fontSize: "0.48rem", color: PAL.uiText, lineHeight: 2.2, marginBottom: 14 }}>
                      52.195km 완주 성공!<br />
                      <span style={{ color: PAL.uiPink }}>우리의 첫 마라톤 클리어</span><br />
                      <span style={{ color: PAL.uiGold, fontSize: "0.42rem" }}>🥇 CONGRATULATIONS 🥇</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFinalClear(); }}
                      style={{
                        background: PAL.uiGold,
                        color: "#0a1a04",
                        border: "none",
                        padding: "10px 20px",
                        fontSize: "0.48rem",
                        cursor: "pointer",
                        ...pixelFont,
                        boxShadow: `3px 3px 0 #a08000`,
                        letterSpacing: "0.04em",
                      }}
                    >
                      ▶ NEXT STAGE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 조작 안내 */}
            {status === "playing" && (
              <div
                style={{
                  ...pixelFont,
                  fontSize: "0.38rem",
                  color: PAL.tea4,
                  textAlign: "center",
                  letterSpacing: "0.03em",
                  opacity: 0.8,
                }}
              >
                [SPACE] / CLICK / TOUCH → JUMP
              </div>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
