/*
 * Stage 9 - 대전 1주년: 성심당 딸기요거롤 받기 게임
 * 빵이 컨베이어 벨트에서 나오면 클릭해서 받기!
 */
import { useState, useEffect, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface BreadItem {
  id: number;
  x: number;
  type: "good" | "bad";
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage09BakeryGame({ stage, onComplete }: Props) {
  const GOAL = 10;
  const TIME = 35;
  const [items, setItems] = useState<BreadItem[]>([]);
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
      if (frameRef.current % 50 === 0) {
        setItems((prev) => [
          ...prev,
          { id: idRef.current++, x: 100, type: Math.random() < 0.7 ? "good" : "bad" },
        ]);
      }
      setItems((prev) =>
        prev.map((item) => ({ ...item, x: item.x - 1.2 })).filter((item) => item.x > -10)
      );
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, failed]);

  const handleClick = (id: number, type: "good" | "bad") => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (type === "good") {
      setScore((s) => {
        const ns = s + 1;
        if (ns >= GOAL) { setCompleted(true); setTimeout(onComplete, 2000); }
        return ns;
      });
    } else {
      setScore((s) => Math.max(0, s - 1));
    }
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={GOAL}
      timeLeft={timeLeft}
      hintText="🍓 딸기요거롤은 클릭! 🥐 크루아상은 피해! 1주년 기념 성심당이야 🐻"
      showBite={failed && !completed}
      onRetry={() => { setScore(0); setTimeLeft(TIME); setItems([]); setFailed(false); setStarted(false); }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">🍓</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                대전 성심당 1주년!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                컨베이어 벨트에서 나오는<br />
                🍓 딸기요거롤을 {GOAL}개 받아봐!<br />
                🥐 크루아상은 피해야 해!
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* 컨베이어 벨트 */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ height: "160px", background: "oklch(0.20 0.05 30 / 0.8)", border: "2px solid oklch(0.78 0.14 55 / 0.4)", touchAction: "none" }}
            >
              {/* 벨트 라인 */}
              <div className="absolute bottom-8 left-0 right-0 h-1 bg-white/20" />
              <div className="absolute bottom-6 left-0 right-0 h-1 bg-white/10" />

              {/* 성심당 간판 */}
              <div className="absolute top-2 left-3 text-xs font-bold px-2 py-1 rounded"
                style={{ background: "oklch(0.72 0.20 30)", color: "white" }}>
                성심당
              </div>

              {items.map((item) => (
                <button
                  key={item.id}
                  className="absolute text-3xl transition-none hover:scale-125"
                  style={{ left: `${item.x}%`, bottom: "24px", transform: "translateX(-50%)" }}
                  onClick={() => handleClick(item.id, item.type)}
                >
                  {item.type === "good" ? "🍓" : "🥐"}
                </button>
              ))}
            </div>

            <p className="text-center text-xs mt-2" style={{ color: "oklch(0.70 0.05 280)" }}>
              🍓 딸기요거롤 클릭! &nbsp; 🥐 크루아상 피해!
            </p>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">💍</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                1주년 기념 완료!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>커플링도 맞췄어! 💕</p>
            </div>
          </div>
        )}

      </div>
    </GameLayout>
  );
}
