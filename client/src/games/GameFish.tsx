/*
 * Stage 5 - 코엑스 아쿠아리움: 물고기 클릭 게임
 * 30초 안에 물고기를 15마리 클릭하면 클리어!
 */
import { useState, useEffect, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Fish {
  id: number;
  x: number;
  y: number;
  emoji: string;
  dx: number;
  dy: number;
  size: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const FISH_EMOJIS = ["🐠", "🐟", "🐡", "🦈", "🐙", "🦑", "🐬", "🦐"];

export default function GameFish({ stage, onComplete }: Props) {
  const GOAL = 15;
  const TIME = 35;
  const [fish, setFish] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(0);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  // 물고기 초기화
  useEffect(() => {
    if (!started) return;
    const initial: Fish[] = Array.from({ length: 6 }, (_, i) => ({
      id: idRef.current++,
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 5,
      emoji: FISH_EMOJIS[i % FISH_EMOJIS.length],
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      size: 28 + Math.floor(Math.random() * 16),
    }));
    setFish(initial);
  }, [started]);

  // 타이머
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

  // 물고기 이동
  useEffect(() => {
    if (!started || completed || failed) return;
    const loop = () => {
      frameRef.current++;
      // 새 물고기 스폰
      if (frameRef.current % 90 === 0) {
        setFish((prev) => [
          ...prev,
          {
            id: idRef.current++,
            x: Math.random() * 80 + 5,
            y: Math.random() * 70 + 5,
            emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
            dx: (Math.random() - 0.5) * 1.5,
            dy: (Math.random() - 0.5) * 1.5,
            size: 28 + Math.floor(Math.random() * 16),
          },
        ]);
      }
      setFish((prev) =>
        prev.map((f) => {
          let nx = f.x + f.dx;
          let ny = f.y + f.dy;
          let ndx = f.dx;
          let ndy = f.dy;
          if (nx < 2 || nx > 92) ndx = -ndx;
          if (ny < 2 || ny > 85) ndy = -ndy;
          return { ...f, x: nx, y: ny, dx: ndx, dy: ndy };
        })
      );
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, failed]);

  const handleCatch = (id: number) => {
    setFish((prev) => prev.filter((f) => f.id !== id));
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
      hintText="물고기를 빠르게 클릭해! 큰 물고기가 더 잘 잡혀 🐠 🐻"
      showBite={failed && !completed}
      onRetry={() => { setScore(0); setTimeLeft(TIME); setFish([]); setFailed(false); setStarted(false); }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-float">🐠</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                코엑스 아쿠아리움!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                헤엄치는 물고기를 {GOAL}마리 잡아봐!<br />
                35초 안에 클리어해야 해 🌊
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden select-none"
            style={{
              minHeight: "380px",
              background: "linear-gradient(180deg, oklch(0.25 0.12 220 / 0.8), oklch(0.15 0.10 230 / 0.9))",
              border: "2px solid oklch(0.50 0.15 220 / 0.5)",
              touchAction: "none",
            }}
          >
            {fish.map((f) => (
              <button
                key={f.id}
                className="absolute transition-none select-none hover:scale-125"
                style={{ left: `${f.x}%`, top: `${f.y}%`, fontSize: f.size, transform: "translate(-50%, -50%)", lineHeight: 1 }}
                onClick={() => handleCatch(f.id)}
              >
                {f.emoji}
              </button>
            ))}
            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
              <span className="text-xs" style={{ color: "oklch(0.90 0.05 60 / 0.7)" }}>물고기를 클릭해!</span>
            </div>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🐠</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>아쿠아리움 완료!</h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>다음은 포항·영덕 여행! 🦀</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
