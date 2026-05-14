/*
 * Stage 11 - 보성 녹차마라톤: 2D 횡스크롤 달리기 게임
 *
 * Step 1: 영서 10km (내부 점수 10000)
 * Step 2: 진성 42.195km (내부 점수 42195)
 *
 * 물리: requestAnimationFrame 기반 게임 루프, 중력 적용 점프
 * 충돌: AABB 박스 충돌 감지, 무적 1.5초
 * 아이템: 에너지 겔 (+500 보너스)
 * 목숨: 3개 (Step 전환 시 리셋)
 *
 * 거리 표시: 내부 정수 / 1000 → 소수점 3자리 (예: 10.000 km)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type GameStatus = "idle" | "playing" | "paused" | "gameover" | "step_clear" | "cleared";
type SpawnType = "obstacle" | "item";

interface Sprite {
  id: number;
  x: number;       // px (캔버스 기준)
  type: SpawnType;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const CANVAS_W = 640;
const CANVAS_H = 220;
const GROUND_Y = 160;          // 바닥 y (캐릭터 발 기준)
const PLAYER_W = 64;
const PLAYER_H = 80;
const PLAYER_X = 80;           // 플레이어 고정 x

const SPRITE_W = 48;
const SPRITE_H = 48;

const GRAVITY = 0.65;
const JUMP_VY = -14;
const MAX_FALL = 18;

const STEP1_TARGET = 10000;    // 10.000 km
const STEP2_TARGET = 42195;    // 42.195 km
const GEL_BONUS = 500;         // +0.500 km
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1500;

// 스텝별 속도 설정
const STEP_CONFIG = {
  1: { scrollSpeed: 4.5, spawnInterval: 90, itemChance: 0.25, scorePerFrame: 3 },
  2: { scrollSpeed: 5.8, spawnInterval: 72, itemChance: 0.28, scorePerFrame: 4 },
} as const;

// 이미지 경로
const IMG_YEONGSEO = "/webdev-static-assets/caricature-run-yeongseo.png";
const IMG_JINSEONG = "/webdev-static-assets/caricature-run-jinseong.png";
const IMG_OBSTACLE = "/webdev-static-assets/obstacle-bush.png";
const IMG_GEL = "/webdev-static-assets/item-energy-gel.png";
const IMG_HEART = "/webdev-static-assets/icon-heart.png";

// ─── 유틸 ────────────────────────────────────────────────────────────────────
function formatDist(internal: number): string {
  const km = internal / 1000;
  return km.toFixed(3) + " km";
}

// 이미지 로드 헬퍼 (실패해도 null 반환)
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// AABB 충돌 (여유 마진 포함)
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

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // ── 게임 상태 (ref로 관리 → 게임 루프에서 직접 참조) ──
  const statusRef = useRef<GameStatus>("idle");
  const stepRef = useRef<1 | 2>(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const invincibleRef = useRef(false);
  const invincibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCountRef = useRef(0);
  const spritesRef = useRef<Sprite[]>([]);
  const spriteIdRef = useRef(0);
  const groundOffsetRef = useRef(0);

  // 플레이어 물리
  const playerYRef = useRef(GROUND_Y - PLAYER_H);
  const playerVYRef = useRef(0);
  const isGroundedRef = useRef(true);

  // 이미지 캐시
  const imgsRef = useRef<Record<string, HTMLImageElement | null>>({});

  // 이펙트 텍스트 (에너지업! 등)
  const effectsRef = useRef<{ id: number; text: string; x: number; y: number; life: number }[]>([]);
  const effectIdRef = useRef(0);

  // ── React 상태 (UI 렌더링용) ──
  const [status, setStatus] = useState<GameStatus>("idle");
  const [step, setStep] = useState<1 | 2>(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  // ── 이미지 사전 로드 ──
  useEffect(() => {
    const srcs = [IMG_YEONGSEO, IMG_JINSEONG, IMG_OBSTACLE, IMG_GEL, IMG_HEART];
    Promise.all(srcs.map(async (src) => {
      const img = await loadImg(src);
      imgsRef.current[src] = img;
    }));
  }, []);

  // ── 점프 ──
  const jump = useCallback(() => {
    if (!isGroundedRef.current) return;
    if (statusRef.current !== "playing") return;
    playerVYRef.current = JUMP_VY;
    isGroundedRef.current = false;
  }, []);

  // ── 입력 이벤트 ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  // ── 충돌 후 무적 처리 ──
  const triggerInvincible = useCallback(() => {
    invincibleRef.current = true;
    if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);
    invincibleTimerRef.current = setTimeout(() => {
      invincibleRef.current = false;
    }, INVINCIBLE_MS);
  }, []);

  // ── 게임 루프 ──
  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = STEP_CONFIG[stepRef.current];
    frameCountRef.current++;

    // 1) 점수 증가
    scoreRef.current += cfg.scorePerFrame;
    const target = stepRef.current === 1 ? STEP1_TARGET : STEP2_TARGET;

    if (scoreRef.current >= target) {
      scoreRef.current = target;
      statusRef.current = stepRef.current === 1 ? "step_clear" : "cleared";
      setScore(scoreRef.current);
      setStatus(statusRef.current);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    // 2) 플레이어 물리
    if (!isGroundedRef.current) {
      playerVYRef.current = Math.min(playerVYRef.current + GRAVITY, MAX_FALL);
      playerYRef.current += playerVYRef.current;
      if (playerYRef.current >= GROUND_Y - PLAYER_H) {
        playerYRef.current = GROUND_Y - PLAYER_H;
        playerVYRef.current = 0;
        isGroundedRef.current = true;
      }
    }

    // 3) 바닥 스크롤
    groundOffsetRef.current += cfg.scrollSpeed;

    // 4) 스프라이트 이동 & 제거
    spritesRef.current = spritesRef.current
      .map((s) => ({ ...s, x: s.x - cfg.scrollSpeed }))
      .filter((s) => s.x > -SPRITE_W - 20);

    // 5) 스프라이트 생성
    if (frameCountRef.current % cfg.spawnInterval === 0) {
      const isItem = Math.random() < cfg.itemChance;
      spritesRef.current.push({
        id: spriteIdRef.current++,
        x: CANVAS_W + 20,
        type: isItem ? "item" : "obstacle",
      });
    }

    // 6) 충돌 감지
    const py = playerYRef.current;
    const px = PLAYER_X;
    const spriteY = GROUND_Y - SPRITE_H;

    for (let i = spritesRef.current.length - 1; i >= 0; i--) {
      const s = spritesRef.current[i];
      if (s.x > CANVAS_W) continue;

      if (s.type === "obstacle") {
        if (!invincibleRef.current && isColliding(px, py, PLAYER_W, PLAYER_H, s.x, spriteY, SPRITE_W, SPRITE_H)) {
          // 충돌
          livesRef.current -= 1;
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
        // 아이템 획득
        if (isColliding(px, py, PLAYER_W, PLAYER_H, s.x, spriteY, SPRITE_W, SPRITE_H, 6)) {
          scoreRef.current = Math.min(scoreRef.current + GEL_BONUS, target);
          spritesRef.current.splice(i, 1);
          effectsRef.current.push({
            id: effectIdRef.current++,
            text: "에너지업! ⚡",
            x: PLAYER_X + PLAYER_W / 2,
            y: py - 10,
            life: 60,
          });
        }
      }
    }

    // 7) 이펙트 업데이트
    effectsRef.current = effectsRef.current
      .map((e) => ({ ...e, y: e.y - 0.8, life: e.life - 1 }))
      .filter((e) => e.life > 0);

    // 8) 렌더링
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 배경 그라디언트
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, stepRef.current === 1 ? "#a8d8a8" : "#7ec8e3");
    bgGrad.addColorStop(1, stepRef.current === 1 ? "#4a9e5c" : "#3a7bd5");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 원거리 산/언덕
    ctx.fillStyle = stepRef.current === 1 ? "rgba(60,120,60,0.3)" : "rgba(40,80,160,0.25)";
    const hillOffset = (groundOffsetRef.current * 0.3) % 80;
    for (let hx = -hillOffset; hx < CANVAS_W + 80; hx += 80) {
      ctx.beginPath();
      ctx.arc(hx + 40, GROUND_Y - 10, 38, Math.PI, 0);
      ctx.fill();
    }

    // 바닥
    ctx.fillStyle = stepRef.current === 1 ? "#5a8a3a" : "#8B6914";
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // 바닥 줄무늬 (스크롤)
    ctx.fillStyle = stepRef.current === 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.1)";
    const stripeOffset = groundOffsetRef.current % 40;
    for (let lx = -stripeOffset; lx < CANVAS_W; lx += 40) {
      ctx.fillRect(lx, GROUND_Y, 20, CANVAS_H - GROUND_Y);
    }

    // 스프라이트 렌더링
    for (const s of spritesRef.current) {
      const sy = GROUND_Y - SPRITE_H;
      if (s.type === "obstacle") {
        const obsImg = imgsRef.current[IMG_OBSTACLE];
        if (obsImg) {
          ctx.drawImage(obsImg, s.x, sy, SPRITE_W, SPRITE_H);
        } else {
          // 폴백: 녹색 덤불
          ctx.fillStyle = "#2d7a2d";
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W / 2, sy + SPRITE_H * 0.55, SPRITE_W * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1e5c1e";
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W * 0.3, sy + SPRITE_H * 0.65, SPRITE_W * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(s.x + SPRITE_W * 0.7, sy + SPRITE_H * 0.65, SPRITE_W * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const gelImg = imgsRef.current[IMG_GEL];
        if (gelImg) {
          ctx.drawImage(gelImg, s.x, sy + 4, SPRITE_W, SPRITE_H - 4);
        } else {
          // 폴백: 에너지 겔 (노란 캡슐)
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.roundRect(s.x + 8, sy + 8, SPRITE_W - 16, SPRITE_H - 16, 8);
          ctx.fill();
          ctx.fillStyle = "#FFA500";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡", s.x + SPRITE_W / 2, sy + SPRITE_H / 2 + 6);
        }
      }
    }

    // 플레이어 렌더링
    const playerImg = imgsRef.current[stepRef.current === 1 ? IMG_YEONGSEO : IMG_JINSEONG];
    const blinkOn = invincibleRef.current && Math.floor(frameCountRef.current / 5) % 2 === 0;
    if (!blinkOn) {
      if (playerImg) {
        ctx.drawImage(playerImg, PLAYER_X, playerYRef.current, PLAYER_W, PLAYER_H);
      } else {
        // 폴백: 달리는 사람 이모지
        ctx.font = `${PLAYER_H * 0.85}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(stepRef.current === 1 ? "🏃‍♀️" : "🏃", PLAYER_X, playerYRef.current + PLAYER_H - 4);
      }
    }

    // 이펙트 텍스트
    for (const ef of effectsRef.current) {
      const alpha = Math.min(1, ef.life / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 14px 'Gowun Dodum', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ef.text, ef.x, ef.y);
      ctx.globalAlpha = 1;
    }

    // UI 업데이트 (매 10프레임마다)
    if (frameCountRef.current % 10 === 0) {
      setScore(scoreRef.current);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [triggerInvincible]);

  // ── 게임 시작 ──
  const startGame = useCallback((targetStep: 1 | 2) => {
    cancelAnimationFrame(rafRef.current);
    if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);

    stepRef.current = targetStep;
    statusRef.current = "playing";
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    invincibleRef.current = false;
    frameCountRef.current = 0;
    spritesRef.current = [];
    groundOffsetRef.current = 0;
    playerYRef.current = GROUND_Y - PLAYER_H;
    playerVYRef.current = 0;
    isGroundedRef.current = true;
    effectsRef.current = [];

    setStep(targetStep);
    setStatus("playing");
    setScore(0);
    setLives(MAX_LIVES);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Step 1 클리어 → Step 2 시작 ──
  const handleStep2Start = useCallback(() => {
    startGame(2);
  }, [startGame]);

  // ── 게임 오버 → 현재 스텝 재시작 ──
  const handleRetry = useCallback(() => {
    startGame(stepRef.current);
  }, [startGame]);

  // ── 최종 클리어 ──
  const handleFinalClear = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // ── 언마운트 시 정리 ──
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);
    };
  }, []);

  // ── 캔버스 클릭/터치 점프 ──
  const handleCanvasInteract = useCallback(() => {
    jump();
  }, [jump]);

  // ── 목숨 하트 렌더 ──
  const renderHearts = () => {
    const heartImg = imgsRef.current[IMG_HEART];
    return Array.from({ length: MAX_LIVES }, (_, i) => {
      const filled = i < lives;
      return heartImg ? (
        <img
          key={i}
          src={IMG_HEART}
          alt="❤️"
          style={{
            width: 22,
            height: 22,
            objectFit: "contain",
            opacity: filled ? 1 : 0.2,
            filter: filled ? "none" : "grayscale(1)",
          }}
        />
      ) : (
        <span key={i} style={{ fontSize: "1.2rem", opacity: filled ? 1 : 0.25 }}>
          ❤️
        </span>
      );
    });
  };

  // ─── 렌더 ────────────────────────────────────────────────────────────────
  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={stepRef.current === 1 ? STEP1_TARGET : STEP2_TARGET}
      hintText="스페이스바·클릭·터치로 점프! 장애물을 피하고 에너지 겔을 먹어 거리를 늘려봐 🏃"
      showProgress={false}
    >
      <div className="flex-1 flex flex-col items-center px-3 py-2 gap-2">

        {/* 안내 문구 */}
        <div
          style={{
            fontFamily: "'Gowun Dodum', sans-serif",
            fontSize: "0.82rem",
            color: "oklch(0.85 0.08 145)",
            textAlign: "center",
            padding: "4px 12px",
            background: "oklch(0.14 0.05 145 / 0.6)",
            borderRadius: 20,
            border: "1px solid oklch(0.50 0.10 145 / 0.4)",
          }}
        >
          영서는 10km, 진성이는 42km! 열심히 뛰어보자~
        </div>

        {/* ── 시작 화면 ── */}
        {!started && status === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div
              style={{
                background: "oklch(0.13 0.04 280 / 0.90)",
                border: "1.5px solid oklch(0.60 0.14 145 / 0.55)",
                borderRadius: 20,
                padding: "28px 24px",
                maxWidth: 360,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ fontSize: "2.8rem", marginBottom: 8 }}>🏃‍♀️🏃</div>
              <h2
                style={{
                  color: "oklch(0.82 0.14 145)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                보성 녹차마라톤
              </h2>
              <p
                style={{
                  color: "oklch(0.82 0.05 60)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.88rem",
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                영서 <strong style={{ color: "oklch(0.85 0.12 350)" }}>10km</strong> +
                진성이 <strong style={{ color: "oklch(0.85 0.12 55)" }}>42.195km</strong><br />
                합계 <strong style={{ color: "oklch(0.88 0.14 145)" }}>52.195km</strong> 완주에 도전!
              </p>
              <p
                style={{
                  color: "oklch(0.70 0.05 280)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.78rem",
                  marginBottom: 20,
                }}
              >
                스페이스바 · 클릭 · 터치로 점프
              </p>
              <button
                className="btn-star"
                style={{ width: "100%" }}
                onClick={() => {
                  setStarted(true);
                  startGame(1);
                }}
              >
                달리기 시작! 🏃‍♀️
              </button>
            </div>
          </div>
        )}

        {/* ── 게임 플레이 영역 ── */}
        {started && (status === "playing" || status === "step_clear" || status === "gameover" || status === "cleared") && (
          <div className="flex flex-col items-center gap-2 w-full">

            {/* 스텝 + 거리 + 목숨 HUD */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: CANVAS_W,
                padding: "4px 10px",
                background: "oklch(0.12 0.04 280 / 0.75)",
                borderRadius: 10,
                border: "1px solid oklch(0.30 0.05 280)",
              }}
            >
              {/* 스텝 배지 */}
              <div
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: "bold",
                  color: step === 1 ? "oklch(0.80 0.14 350)" : "oklch(0.80 0.14 55)",
                  background: step === 1 ? "oklch(0.20 0.06 350 / 0.6)" : "oklch(0.20 0.06 55 / 0.6)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  border: `1px solid ${step === 1 ? "oklch(0.60 0.14 350 / 0.5)" : "oklch(0.60 0.14 55 / 0.5)"}`,
                }}
              >
                {step === 1 ? "Step 1 · 영서" : "Step 2 · 진성"}
              </div>

              {/* 거리 */}
              <div
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.92rem",
                  fontWeight: "bold",
                  color: "oklch(0.90 0.10 145)",
                  letterSpacing: "0.02em",
                }}
              >
                {formatDist(score)} / {formatDist(step === 1 ? STEP1_TARGET : STEP2_TARGET)}
              </div>

              {/* 목숨 */}
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {renderHearts()}
              </div>
            </div>

            {/* 캔버스 */}
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: CANVAS_W,
                borderRadius: 14,
                overflow: "hidden",
                border: "2px solid oklch(0.50 0.12 145 / 0.5)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                cursor: "pointer",
                touchAction: "none",
              }}
              onClick={handleCanvasInteract}
              onTouchStart={(e) => { e.preventDefault(); handleCanvasInteract(); }}
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
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(3px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.14 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.72 0.12 350 / 0.7)",
                      borderRadius: 18,
                      padding: "24px 28px",
                      textAlign: "center",
                      maxWidth: 320,
                      animation: "popIn 0.35s ease-out",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>🎉</div>
                    <p
                      style={{
                        color: "oklch(0.92 0.08 60)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        lineHeight: 1.6,
                        marginBottom: 18,
                      }}
                    >
                      영서 10km 완주 성공!<br />
                      진성이에게 바통 터치 🏃‍♂️💨
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.9rem" }}
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
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.60)",
                    backdropFilter: "blur(3px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.14 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.65 0.22 20 / 0.7)",
                      borderRadius: 18,
                      padding: "24px 28px",
                      textAlign: "center",
                      maxWidth: 300,
                      animation: "popIn 0.35s ease-out",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>😵</div>
                    <p
                      style={{
                        color: "oklch(0.90 0.08 60)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginBottom: 6,
                      }}
                    >
                      쓰러졌어요!
                    </p>
                    <p
                      style={{
                        color: "oklch(0.70 0.05 280)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "0.82rem",
                        marginBottom: 18,
                      }}
                    >
                      {step === 1 ? "영서" : "진성이"}가 {formatDist(score)} 달렸어요
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.9rem" }}
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
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(3px)",
                  }}
                >
                  <div
                    style={{
                      background: "oklch(0.14 0.05 280 / 0.97)",
                      border: "2px solid oklch(0.78 0.14 55 / 0.7)",
                      borderRadius: 18,
                      padding: "28px 28px",
                      textAlign: "center",
                      maxWidth: 340,
                      animation: "popIn 0.4s ease-out",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 40px oklch(0.78 0.14 55 / 0.2)",
                    }}
                  >
                    <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🥇🎊</div>
                    <p
                      style={{
                        color: "oklch(0.92 0.10 55)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        fontSize: "1.05rem",
                        fontWeight: "bold",
                        lineHeight: 1.65,
                        marginBottom: 18,
                      }}
                    >
                      52.195km 완주 성공!<br />
                      우리의 첫 마라톤 클리어 🥇
                    </p>
                    <button
                      className="btn-star"
                      style={{ width: "100%", fontSize: "0.95rem" }}
                      onClick={(e) => { e.stopPropagation(); handleFinalClear(); }}
                    >
                      다음 기억으로 →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 조작 안내 (플레이 중) */}
            {status === "playing" && (
              <p
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.72rem",
                  color: "oklch(0.60 0.05 280)",
                  textAlign: "center",
                }}
              >
                스페이스바 · 클릭 · 터치로 점프 | 🌿 장애물 피하기 | ⚡ 에너지 겔 먹기
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.75); opacity: 0; }
          70%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </GameLayout>
  );
}