/*
 * Stage 10 - 400일 벚꽃스냅: 벚꽃잎 클릭 모으기
 * 떨어지는 벚꽃잎을 40개 클릭하면 클리어!
 */
import { useState, useEffect, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Petal {
  id: number;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  drift: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage10CherryBlossomGame({ stage, onComplete }: Props) {
  const GOAL = 40;
  const TIME = 40;
  const [petals, setPetals] = useState<Petal[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(0);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

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

  useEffect(() => {
    if (!started || completed || failed) return;
    const loop = () => {
      frameRef.current++;
      if (frameRef.current % 20 === 0) {
        setPetals((prev) => [
          ...prev,
          {
            id: idRef.current++,
            x: Math.random() * 90 + 2,
            y: -5,
            rotation: Math.random() * 360,
            speed: 0.8 + Math.random() * 1.2,
            drift: (Math.random() - 0.5) * 0.5,
          },
        ]);
      }
      setPetals((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + p.speed, x: p.x + p.drift, rotation: p.rotation + 2 }))
          .filter((p) => p.y < 110)
      );
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, failed]);

  const handleCatch = (id: number) => {
    setPetals((prev) => prev.filter((p) => p.id !== id));
    setScore((s) => {
      const ns = s + 1;
      if (ns >= GOAL) { setCompleted(true); setTimeout(onComplete, 2000); }
      return ns;
    });
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={GOAL}
      timeLeft={timeLeft}
      hintText="떨어지는 벚꽃잎을 빠르게 클릭해! 400일 기념 벚꽃 스냅 기억나? 🌸 🐻"
      showBite={failed && !completed}
      onRetry={() => { setScore(0); setTimeLeft(TIME); setPetals([]); setFailed(false); setStarted(false); }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-float">🌸</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                400일 벚꽃 스냅!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                떨어지는 벚꽃잎을 {GOAL}개 잡아봐!<br />
                40초 안에 클리어해야 해 🌸
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden select-none"
            style={{
              minHeight: "380px",
              background: "linear-gradient(180deg, oklch(0.85 0.05 350 / 0.3), oklch(0.75 0.08 340 / 0.2))",
              border: "2px solid oklch(0.72 0.12 350 / 0.4)",
              touchAction: "none",
            }}
          >
            {petals.map((p) => (
              <button
                key={p.id}
                className="absolute text-2xl hover:scale-125 transition-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                  lineHeight: 1,
                }}
                onClick={() => handleCatch(p.id)}
              >
                🌸
              </button>
            ))}
            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
              <span className="text-xs" style={{ color: "oklch(0.72 0.12 350)" }}>벚꽃잎을 클릭해! 🌸</span>
            </div>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🌸</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                400일 기념 완료!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>다음은 보성 녹차마라톤! 🍵</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
