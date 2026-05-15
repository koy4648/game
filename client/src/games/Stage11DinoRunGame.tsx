/*
 * Stage 11 - 보성 녹차마라톤: 2D 횡스크롤 달리기 게임
 *
 * Step 1: 영서 10km  (내부 점수 10000)
 * Step 2: 진성 42.195km (내부 점수 42195)
 *
 * 물리: requestAnimationFrame 기반 게임 루프, 중력 적용 점프
 * 충돌: AABB 박스 충돌 감지, 무적 1.5초
 * 아이템: 에너지 겔 (+500 보너스)
 * 목숨: 3개 (Step 전환 시 리셋)
 *
 * 거리 표시: 내부 정수 / 1000 → 소수점 3자리 (예: 10.000 km)
 *
 * 디자인: 별빛 동화 여행 (Dreamy Fairytale Night Sky)
 *   - 딥 네이비/미드나잇 퍼플 배경에 골드·핑크 포인트
 *   - 캔버스: 새벽 녹차밭 → 별빛 야간 마라톤 분위기
 *   - HUD: 글라스모피즘 카드, 팝업: card-glow 패턴
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
type SpawnType = "obstacle" | "item";

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
  color: string;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const CANVAS_W = 680;
const CANVAS_H = 240;
const GROUND_Y = 178;
const PLAYER_W = 68;
const PLAYER_H = 84;
const PLAYER_X = 88;

const SPRITE_W = 52;
const SPRITE_H = 52;

const GRAVITY = 0.62;
const JUMP_VY = -14.5;
const MAX_FALL = 18;

const STEP1_TARGET = 10000;
const STEP2_TARGET = 42195;
const GEL_BONUS = 500;
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1500;

const STEP_CONFIG = {
  1: { scrollSpeed: 4.2, spawnInterval: 95,  itemChance: 0.28, scorePerFrame: 3 },
  2: { scrollSpeed: 5.5, spawnInterval: 75,  itemChance: 0.30, scorePerFrame: 4 },
} as const;

// 이미지 경로
const IMG_YEONGSEO = "/webdev-static-assets/caricature-run-yeongseo.png";
const IMG_JINSEONG  = "/webdev-static-assets/caricature-run-jinseong.png";
const IMG_OBSTACLE  = "/webdev-static-assets/obstacle-bush.png";
const IMG_GEL       = "/webdev-static-assets/item-energy-gel.png";

// ─── 팔레트 (캔버스 내부용) ──────────────────────────────────────────────────
// Step 1: 새벽 녹차밭 (딥 그린 → 미드나잇 퍼플 그라디언트)
const PALETTE_S1 = {
  skyTop:    "#0d1b2a",   // 딥 네이비
  skyBot:    "#1a3a2a",   // 딥 그린
  hillFar:   "rgba(20,60,30,0.55)",
  hillMid:   "rgba(30,80,40,0.40)",
  ground:    "#1e4a28",
  groundStr: "rgba(100,220,120,0.10)",
  starColor: "rgba(200,255,200,0.7)",
  moonColor: "#c8f0d0",
  pathLine:  "rgba(120,220,140,0.25)",
};
// Step 2: 새벽 야간 마라톤 (딥 네이비 → 미드나잇 퍼플)
const PALETTE_S2 = {
  skyTop:    "#0a0d1e",
  skyBot:    "#1a1040",
  hillFar:   "rgba(30,20,70,0.55)",
  hillMid:   "rgba(50,30,90,0.40)",
  ground:    "#1a1535",
  groundStr: "rgba(160,120,255,0.10)",
  starColor: "rgba(220,200,255,0.8)",
  moonColor: "#e8d8ff",
  pathLine:  "rgba(180,140,255,0.20)",
};

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
  margin = 10
): boolean {
  return (
    px + margin < sx + sw - margin &&
    px + pw - margin > sx + margin &&
    py + margin < sy + sh - margin &&
    py + ph - margin > sy + margin
  );
}

// ─── 캔버스 렌더 헬퍼 ────────────────────────────────────────────────────────
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // ── 게임 상태 ref (루프 내 직접 참조) ──
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
  const starOffRef     = useRef(0);
  const hillOffRef     = useRef(0);

  // 플레이어 물리
  const playerYRef  = useRef(GROUND_Y - PLAYER_H);
  const playerVYRef = useRef(0);
  const groundedRef = useRef(true);

  // 이미지 캐시
  const imgsRef = useRef<Record<string, HTMLImageElement | null>>({});

  // 이펙트
  const effectsRef  = useRef<FloatEffect[]>([]);
  const effectIdRef = useRef(0);

  // 별 위치 (고정 시드)
  const starsRef = useRef<{ x: number; y: number; r: number; twinkle: number }[]>([]);
  useEffect(() => {
    starsRef.current = Array.from({ length: 28 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * (GROUND_Y - 30),
      r: 0.6 + Math.random() * 1.2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }, []);

  // ── React 상태 (UI 렌더링용) ──
  const [status,  setStatus]  = useState<GameStatus>("idle");
  const [step,    setStep]    = useState<1 | 2>(1);
  const [score,   setScore]   = useState(0);
  const [lives,   setLives]   = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  // ── 이미지 사전 로드 ──
  useEffect(() => {
    [IMG_YEONGSEO, IMG_JINSEONG, IMG_OBSTACLE, IMG_GEL].forEach(async (src) => {
      imgsRef.current[src] = await loadImg(src);
    });
  }, []);

  // ── 점프 ──
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

  // ── 무적 트리거 ──
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

    const cfg    = STEP_CONFIG[stepRef.current];
    const pal    = stepRef.current === 1 ? PALETTE_S1 : PALETTE_S2;
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
      if (playerYRef.current >= GROUND_Y - PLAYER_H) {
        playerYRef.current = GROUND_Y - PLAYER_H;
        playerVYRef.current = 0;
        groundedRef.current = true;
      }
    }

    // 3) 스크롤 오프셋
    groundOffRef.current = (groundOffRef.current + cfg.scrollSpeed) % 48;
    starOffRef.current   = (starOffRef.current   + 0.08)            % CANVAS_W;
    hillOffRef.current   = (hillOffRef.current   + cfg.scrollSpeed * 0.25) % 120;

    // 4) 스프라이트 이동
    spritesRef.current = spritesRef.current
      .map((s) => ({ ...s, x: s.x - cfg.scrollSpeed }))
      .filter((s) => s.x > -SPRITE_W - 20);

    // 5) 스프라이트 생성
    if (fc % cfg.spawnInterval === 0) {
      spritesRef.current.push({
        id: spriteIdRef.current++,
        x: CANVAS_W + 20,
        type: Math.random() < cfg.itemChance ? "item" : "obstacle",
      });
    }

    // 6) 충돌
    const py = playerYRef.current;
    const collSpriteY = GROUND_Y - SPRITE_H;
    for (let i = spritesRef.current.length - 1; i >= 0; i--) {
      const s = spritesRef.current[i];
      if (s.x > CANVAS_W) continue;
      if (s.type === "obstacle") {
        if (!invincibleRef.current && isColliding(PLAYER_X, py, PLAYER_W, PLAYER_H, s.x, collSpriteY, SPRITE_W, SPRITE_H)) {
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
        if (isColliding(PLAYER_X, py, PLAYER_W, PLAYER_H, s.x, collSpriteY, SPRITE_W, SPRITE_H, 6)) {
          scoreRef.current = Math.min(scoreRef.current + GEL_BONUS, target);
          spritesRef.current.splice(i, 1);
          effectsRef.current.push({
            id: effectIdRef.current++,
            text: "에너지업! ⚡",
            x: PLAYER_X + PLAYER_W / 2,
            y: py - 8,
            life: 55,
            color: "#ffd700",
          });
        }
      }
    }

    // 7) 이펙트 업데이트
    effectsRef.current = effectsRef.current
      .map((e) => ({ ...e, y: e.y - 0.9, life: e.life - 1 }))
      .filter((e) => e.life > 0);

    // ── 8) 렌더링 ──────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 하늘 그라디언트
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, pal.skyTop);
    skyGrad.addColorStop(1, pal.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // 별
    const t = fc * 0.04;
    for (const star of starsRef.current) {
      const alpha = 0.45 + 0.55 * Math.sin(star.twinkle + t);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pal.starColor;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 달 (우측 상단)
    const moonX = CANVAS_W - 56;
    const moonY = 28;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 2, moonX, moonY, 18);
    moonGrad.addColorStop(0, pal.moonColor);
    moonGrad.addColorStop(0.7, pal.moonColor + "cc");
    moonGrad.addColorStop(1, pal.moonColor + "00");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();
    // 달 글로우
    ctx.shadowColor = pal.moonColor;
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = pal.moonColor + "66";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 원거리 언덕 (느리게)
    ctx.fillStyle = pal.hillFar;
    for (let hx = -(hillOffRef.current % 120); hx < CANVAS_W + 120; hx += 120) {
      ctx.beginPath();
      ctx.moveTo(hx, GROUND_Y);
      ctx.bezierCurveTo(hx + 30, GROUND_Y - 55, hx + 90, GROUND_Y - 55, hx + 120, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    // 중거리 언덕
    ctx.fillStyle = pal.hillMid;
    const hillOff2 = (hillOffRef.current * 1.6) % 80;
    for (let hx = -(hillOff2); hx < CANVAS_W + 80; hx += 80) {
      ctx.beginPath();
      ctx.moveTo(hx, GROUND_Y);
      ctx.bezierCurveTo(hx + 20, GROUND_Y - 32, hx + 60, GROUND_Y - 32, hx + 80, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }

    // 바닥
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, pal.ground);
    groundGrad.addColorStop(1, pal.skyTop);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // 바닥 경계 글로우 라인
    ctx.strokeStyle = stepRef.current === 1
      ? "rgba(80,200,100,0.35)"
      : "rgba(160,120,255,0.35)";
    ctx.lineWidth = 2;
    ctx.shadowColor = stepRef.current === 1 ? "#50c864" : "#a078ff";
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 바닥 줄무늬 (스크롤)
    ctx.fillStyle = pal.groundStr;
    const strOff = groundOffRef.current % 48;
    for (let lx = -strOff; lx < CANVAS_W; lx += 48) {
      ctx.fillRect(lx, GROUND_Y + 1, 24, CANVAS_H - GROUND_Y - 1);
    }

    // 경로 점선 (마라톤 코스)
    ctx.setLineDash([10, 14]);
    ctx.strokeStyle = pal.pathLine;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 0;
    const dashOff = groundOffRef.current % 24;
    ctx.lineDashOffset = -dashOff;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 10);
    ctx.lineTo(CANVAS_W, GROUND_Y + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // ── 스프라이트 ──
    const spriteY = GROUND_Y - SPRITE_H;
    for (const s of spritesRef.current) {
      if (s.type === "obstacle") {
        const obsImg = imgsRef.current[IMG_OBSTACLE];
        if (obsImg) {
          ctx.drawImage(obsImg, s.x, spriteY, SPRITE_W, SPRITE_H);
        } else {
          // 폴백: 글로우 덤불
          ctx.shadowColor = "#50c864";
          ctx.shadowBlur  = 10;
          ctx.fillStyle = "#1e5c1e";
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W * 0.5, spriteY + SPRITE_H * 0.58, SPRITE_W * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2d8a3a";
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W * 0.28, spriteY + SPRITE_H * 0.68, SPRITE_W * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W * 0.72, spriteY + SPRITE_H * 0.68, SPRITE_W * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        const gelImg = imgsRef.current[IMG_GEL];
        if (gelImg) {
          ctx.drawImage(gelImg, s.x + 4, spriteY + 4, SPRITE_W - 8, SPRITE_H - 8);
        } else {
          // 폴백: 골드 캡슐
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur  = 14;
          const gelGrad = ctx.createLinearGradient(s.x + 8, spriteY + 8, s.x + SPRITE_W - 8, spriteY + SPRITE_H - 8);
          gelGrad.addColorStop(0, "#ffe066");
          gelGrad.addColorStop(1, "#ff9900");
          ctx.fillStyle = gelGrad;
          drawRoundRect(ctx, s.x + 8, spriteY + 10, SPRITE_W - 16, SPRITE_H - 20, 7);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle  = "rgba(0,0,0,0.55)";
          ctx.font       = "bold 15px sans-serif";
          ctx.textAlign  = "center";
          ctx.fillText("⚡", s.x + SPRITE_W / 2, spriteY + SPRITE_H / 2 + 5);
        }
      }
    }

    // ── 플레이어 ──
    const blinkOn = invincibleRef.current && Math.floor(fc / 5) % 2 === 0;
    if (!blinkOn) {
      const playerImg = imgsRef.current[stepRef.current === 1 ? IMG_YEONGSEO : IMG_JINSEONG];
      if (playerImg) {
        // 착지 시 그림자
        if (groundedRef.current) {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.beginPath();
          ctx.ellipse(PLAYER_X + PLAYER_W / 2, GROUND_Y + 4, PLAYER_W * 0.38, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.drawImage(playerImg, PLAYER_X, playerYRef.current, PLAYER_W, PLAYER_H);
      } else {
        ctx.font      = `${PLAYER_H * 0.82}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(stepRef.current === 1 ? "🏃‍♀️" : "🏃", PLAYER_X, playerYRef.current + PLAYER_H - 4);
      }
    }

    // ── 이펙트 텍스트 ──
    for (const ef of effectsRef.current) {
      const alpha = Math.min(1, ef.life / 25);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = ef.color;
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = ef.color;
      ctx.font        = "bold 13px 'Gowun Dodum', sans-serif";
      ctx.textAlign   = "center";
      ctx.fillText(ef.text, ef.x, ef.y);
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    }

    // UI 업데이트
    if (fc % 10 === 0) setScore(scoreRef.current);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [triggerInvincible]);

  // ── 게임 시작 / 리셋 ──
  const startGame = useCallback((targetStep: 1 | 2) => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);

    stepRef.current     = targetStep;
    statusRef.current   = "playing";
    scoreRef.current    = 0;
    livesRef.current    = MAX_LIVES;
    invincibleRef.current = false;
    frameRef.current    = 0;
    spritesRef.current  = [];
    groundOffRef.current = 0;
    hillOffRef.current  = 0;
    playerYRef.current  = GROUND_Y - PLAYER_H;
    playerVYRef.current = 0;
    groundedRef.current = true;
    effectsRef.current  = [];

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

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={target}
      hintText="스페이스바·클릭·터치로 점프! 장애물을 피하고 에너지 겔을 먹어 거리를 늘려봐 🏃"
      showProgress={false}
    >
      <div className="flex-1 flex flex-col items-center px-3 py-2 gap-3">

        {/* 안내 배너 */}
        <div
          style={{
            fontFamily: "'Gowun Dodum', sans-serif",
            fontSize: "0.80rem",
            color: "oklch(0.85 0.10 145)",
            textAlign: "center",
            padding: "5px 16px",
            background: "oklch(0.16 0.06 145 / 0.55)",
            borderRadius: 999,
            border: "1px solid oklch(0.50 0.12 145 / 0.35)",
            letterSpacing: "0.01em",
          }}
        >
          영서는 10km, 진성이는 42km! 열심히 뛰어보자~
        </div>

        {/* ── 시작 화면 ── */}
        {!started && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="card-glow p-7 text-center max-w-sm w-full">
              {/* 캐릭터 미리보기 */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
                {[IMG_YEONGSEO, IMG_JINSEONG].map((src, i) => (
                  <div
                    key={i}
                    style={{
                      width: 64, height: 72,
                      borderRadius: 14,
                      background: "oklch(0.20 0.06 280 / 0.7)",
                      border: `1.5px solid ${i === 0 ? "oklch(0.72 0.12 350 / 0.6)" : "oklch(0.78 0.14 55 / 0.6)"}`,
                      overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 16px ${i === 0 ? "oklch(0.72 0.12 350 / 0.3)" : "oklch(0.78 0.14 55 / 0.3)"}`,
                    }}
                  >
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>

              <h2
                style={{
                  color: "oklch(0.88 0.12 55)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                보성 녹차마라톤 🍵
              </h2>

              {/* 거리 배지 */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                {[
                  { label: "영서", dist: "10 km", color: "oklch(0.72 0.12 350)" },
                  { label: "+", dist: "",         color: "oklch(0.65 0.05 280)" },
                  { label: "진성", dist: "42.195 km", color: "oklch(0.78 0.14 55)" },
                  { label: "=", dist: "",         color: "oklch(0.65 0.05 280)" },
                  { label: "합계", dist: "52.195 km", color: "oklch(0.75 0.15 300)" },
                ].map((item, i) =>
                  item.dist ? (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.68rem", color: item.color, fontFamily: "'Gowun Dodum', sans-serif" }}>{item.label}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: item.color, fontFamily: "'Gowun Dodum', sans-serif" }}>{item.dist}</div>
                    </div>
                  ) : (
                    <div key={i} style={{ color: item.color, fontSize: "1.1rem", alignSelf: "center", paddingBottom: 2 }}>{item.label}</div>
                  )
                )}
              </div>

              <p
                style={{
                  color: "oklch(0.72 0.05 280)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.78rem",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                스페이스바 · 클릭 · 터치로 점프<br />
                장애물 피하고 에너지 겔 먹기!
              </p>

              <button
                className="btn-star"
                style={{ width: "100%" }}
                onClick={() => { setStarted(true); startGame(1); }}
              >
                달리기 시작! 🏃‍♀️
              </button>
            </div>
          </div>
        )}

        {/* ── 게임 플레이 영역 ── */}
        {started && isPlaying && (
          <div className="flex flex-col items-center gap-2 w-full">

            {/* HUD 카드 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                maxWidth: CANVAS_W,
                padding: "6px 12px",
                background: "oklch(0.14 0.05 280 / 0.82)",
                borderRadius: 12,
                border: "1px solid oklch(0.30 0.06 280 / 0.7)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              }}
            >
              {/* 스텝 배지 */}
              <div
                style={{
                  flexShrink: 0,
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: "bold",
                  color: step === 1 ? "oklch(0.85 0.12 350)" : "oklch(0.85 0.12 55)",
                  background: step === 1 ? "oklch(0.22 0.07 350 / 0.65)" : "oklch(0.22 0.07 55 / 0.65)",
                  padding: "3px 9px",
                  borderRadius: 8,
                  border: `1px solid ${step === 1 ? "oklch(0.55 0.14 350 / 0.5)" : "oklch(0.55 0.14 55 / 0.5)"}`,
                  boxShadow: `0 0 10px ${step === 1 ? "oklch(0.72 0.12 350 / 0.3)" : "oklch(0.78 0.14 55 / 0.3)"}`,
                }}
              >
                {step === 1 ? "Step 1 · 영서 🏃‍♀️" : "Step 2 · 진성 🏃"}
              </div>

              {/* 거리 + 프로그레스 바 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Gowun Dodum', sans-serif", fontSize: "0.78rem", fontWeight: "bold", color: "oklch(0.88 0.10 145)" }}>
                    {formatDist(score)}
                  </span>
                  <span style={{ fontFamily: "'Gowun Dodum', sans-serif", fontSize: "0.70rem", color: "oklch(0.60 0.05 280)" }}>
                    / {formatDist(target)}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "oklch(0.22 0.04 280)" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      width: `${pct}%`,
                      background: step === 1
                        ? "linear-gradient(90deg, oklch(0.65 0.18 145), oklch(0.78 0.14 55))"
                        : "linear-gradient(90deg, oklch(0.65 0.18 300), oklch(0.78 0.14 55))",
                      transition: "width 200ms ease",
                      boxShadow: "0 0 8px oklch(0.78 0.14 55 / 0.5)",
                    }}
                  />
                </div>
              </div>

              {/* 목숨 하트 */}
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "1.05rem",
                      opacity: i < lives ? 1 : 0.18,
                      filter: i < lives ? "drop-shadow(0 0 4px #ff6b8a)" : "grayscale(1)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            {/* 캔버스 래퍼 */}
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: CANVAS_W,
                borderRadius: 16,
                overflow: "hidden",
                border: "2px solid oklch(0.35 0.08 280 / 0.7)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px oklch(0.78 0.14 55 / 0.12), inset 0 1px 0 oklch(1 0 0 / 8%)",
                cursor: "pointer",
                touchAction: "none",
              }}
              onClick={() => jump()}
              onTouchStart={(e) => { e.preventDefault(); jump(); }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ display: "block", width: "100%", height: "auto" }}
              />

              {/* ── Step 1 클리어 팝업 ── */}
              {status === "step_clear" && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "oklch(0.05 0.02 280 / 0.72)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.16 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.72 0.12 350 / 0.65)",
                      borderRadius: 20,
                      padding: "24px 28px",
                      textAlign: "center",
                      maxWidth: 300,
                      animation: "s11PopIn 0.38s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 32px oklch(0.72 0.12 350 / 0.25)",
                    }}
                  >
                    <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>🎉</div>
                    <p
                      style={{
                        color: "oklch(0.92 0.08 60)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        lineHeight: 1.65,
                        marginBottom: 18,
                      }}
                    >
                      영서 10km 완주 성공!<br />
                      <span style={{ color: "oklch(0.78 0.12 350)", fontSize: "0.88rem" }}>
                        진성이에게 바통 터치 🏃‍♂️💨
                      </span>
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.88rem", padding: "0.6rem 1.5rem" }}
                      onClick={(e) => { e.stopPropagation(); handleStep2Start(); }}
                    >
                      진성이 달리기 시작 →
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
                    background: "oklch(0.05 0.02 280 / 0.75)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.16 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.65 0.22 20 / 0.65)",
                      borderRadius: 20,
                      padding: "22px 26px",
                      textAlign: "center",
                      maxWidth: 280,
                      animation: "s11PopIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 14px 44px rgba(0,0,0,0.55), 0 0 28px oklch(0.65 0.22 20 / 0.2)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 6 }}>😵</div>
                    <p
                      style={{
                        color: "oklch(0.90 0.06 60)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "0.98rem",
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      쓰러졌어요!
                    </p>
                    <p
                      style={{
                        color: "oklch(0.62 0.05 280)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "0.78rem",
                        marginBottom: 18,
                      }}
                    >
                      {step === 1 ? "영서" : "진성이"}가 {formatDist(score)} 달렸어요
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.88rem", padding: "0.6rem 1.5rem" }}
                      onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                    >
                      🔄 다시 뛰기
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
                    background: "oklch(0.05 0.02 280 / 0.70)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.16 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.78 0.14 55 / 0.65)",
                      borderRadius: 22,
                      padding: "28px 30px",
                      textAlign: "center",
                      maxWidth: 320,
                      animation: "s11PopIn 0.42s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 20px 56px rgba(0,0,0,0.6), 0 0 40px oklch(0.78 0.14 55 / 0.25), inset 0 1px 0 oklch(1 0 0 / 10%)",
                    }}
                  >
                    <div style={{ fontSize: "2.6rem", marginBottom: 8 }}>🥇🎊</div>
                    <p
                      style={{
                        color: "oklch(0.92 0.10 55)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "1.05rem",
                        fontWeight: "bold",
                        lineHeight: 1.7,
                        marginBottom: 6,
                      }}
                    >
                      52.195km 완주 성공!
                    </p>
                    <p
                      style={{
                        color: "oklch(0.78 0.08 350)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "0.88rem",
                        marginBottom: 20,
                      }}
                    >
                      우리의 첫 마라톤 클리어 🥇
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.92rem" }}
                      onClick={(e) => { e.stopPropagation(); handleFinalClear(); }}
                    >
                      다음 기억으로 →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 조작 안내 */}
            {status === "playing" && (
              <p
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.70rem",
                  color: "oklch(0.52 0.05 280)",
                  textAlign: "center",
                  letterSpacing: "0.01em",
                }}
              >
                스페이스바 · 클릭 · 터치로 점프 &nbsp;·&nbsp; 🌿 장애물 피하기 &nbsp;·&nbsp; ⚡ 에너지 겔 먹기
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes s11PopIn {
          0%   { transform: scale(0.72) translateY(10px); opacity: 0; }
          70%  { transform: scale(1.04) translateY(-2px); opacity: 1; }
          100% { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </GameLayout>
  );
}
