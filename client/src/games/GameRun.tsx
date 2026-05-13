/*
 * Stage 10 - 보성 녹차마라톤: 리듬 달리기 게임
 * 좌우 버튼을 번갈아 눌러서 달리기! 목표 거리 달성하면 클리어!
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function GameRun({ stage, onComplete }: Props) {
  const GOAL = 300;
  const TIME = 45;
  const [distance, setDistance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lastStep, setLastStep] = useState<"left" | "right" | null>(null);
  const [combo, setCombo] = useState(0);
  const [animFrame, setAnimFrame] = useState(0);
  const comboRef = useRef(0);

  useEffect(() => {
    if (!started || completed || failed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); setFailed(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed, failed]);

  const step = useCallback((side: "left" | "right") => {
    if (!started || completed || failed) return;
    if (lastStep === side) {
      // 같은 발 연속 → 콤보 리셋
      comboRef.current = 0;
      setCombo(0);
    } else {
      comboRef.current++;
      setCombo(comboRef.current);
      const gain = 1 + Math.min(comboRef.current, 5);
      setDistance((d) => {
        const nd = d + gain;
        if (nd >= GOAL) { setCompleted(true); setTimeout(onComplete, 2000); }
        return Math.min(nd, GOAL);
      });
    }
    setLastStep(side);
    setAnimFrame((f) => f + 1);
  }, [started, completed, failed, lastStep, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.key === "a") step("left");
      if (e.code === "ArrowRight" || e.key === "d") step("right");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step]);

  const progress = Math.min(100, (distance / GOAL) * 100);
  const runnerEmoji = animFrame % 2 === 0 ? "🏃" : "🏃";

  return (
    <GameLayout
      stage={stage}
      score={distance}
      maxScore={GOAL}
      timeLeft={timeLeft}
      hintText="좌우 버튼을 번갈아 눌러야 빨리 달려! 같은 발 연속은 콤보가 깨져 🏃 🐻"
      showBite={failed && !completed}
      onRetry={() => { setDistance(0); setTimeLeft(TIME); setFailed(false); setStarted(false); setLastStep(null); setCombo(0); }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">🏃</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                보성 녹차마라톤!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                좌우 버튼을 번갈아 눌러서 달려봐!<br />
                같은 발 연속은 콤보가 깨져 🍵<br />
                목표: {GOAL}m / 45초
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>달리기 시작!</button>
            </div>
          </div>
        ) : (
          <>
            {/* 진행 바 */}
            <div className="w-full max-w-md mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                <span>🏃 달린 거리</span>
                <span>{distance}m / {GOAL}m</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.65 0.20 140))" }}
                />
              </div>
            </div>

            {/* 달리기 화면 */}
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden mb-4"
              style={{ height: "160px", background: "oklch(0.30 0.12 145 / 0.5)", border: "2px solid oklch(0.55 0.18 145 / 0.5)", position: "relative" }}
            >
              {/* 녹차밭 배경 스크롤 효과 */}
              <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center gap-1 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className="text-lg flex-shrink-0" style={{ transform: `translateX(-${(distance * 2) % 40}px)` }}>🌿</span>
                ))}
              </div>

              {/* 달리는 캐릭터 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="text-6xl"
                  style={{ transform: `translateY(${animFrame % 2 === 0 ? -4 : 4}px)`, transition: "transform 0.1s" }}
                >
                  🏃
                </div>
              </div>

              {/* 콤보 */}
              {combo > 1 && (
                <div className="absolute top-2 right-3 text-sm font-bold animate-bounce-in"
                  style={{ color: "oklch(0.78 0.14 55)" }}>
                  {combo}콤보! ⚡
                </div>
              )}
            </div>

            {/* 좌우 버튼 */}
            <div className="flex gap-6 w-full max-w-md justify-center">
              <button
                className="flex-1 py-6 rounded-2xl text-4xl font-bold transition-all active:scale-95"
                style={{
                  background: lastStep === "left" ? "oklch(0.55 0.18 145 / 0.8)" : "oklch(0.22 0.06 275 / 0.8)",
                  border: "2px solid oklch(0.55 0.18 145 / 0.5)",
                }}
                onClick={() => step("left")}
              >
                👈
              </button>
              <button
                className="flex-1 py-6 rounded-2xl text-4xl font-bold transition-all active:scale-95"
                style={{
                  background: lastStep === "right" ? "oklch(0.55 0.18 145 / 0.8)" : "oklch(0.22 0.06 275 / 0.8)",
                  border: "2px solid oklch(0.55 0.18 145 / 0.5)",
                }}
                onClick={() => step("right")}
              >
                👉
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "oklch(0.70 0.05 280)" }}>
              번갈아 눌러야 빨라! (키보드: ← →)
            </p>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🍵</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                마라톤 완주!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>다음은 야구장! ⚾</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
