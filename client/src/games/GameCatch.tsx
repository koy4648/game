/*
 * Legacy unused game: 떨어지는 아이템 받기
 * 현재 GameContext.STAGES에서는 사용하지 않는다.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  caught: boolean;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function GameCatch({ stage, onComplete }: Props) {
  const isJeju = stage.id === 7;
  const GOAL = isJeju ? 15 : 12;
  const TIME = 30;
  const EMOJI = isJeju ? "🍊" : "🎂";
  const BAD_EMOJI = isJeju ? "🌊" : "💔";

  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [basketX, setBasketX] = useState(50);
  const idRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  const spawnItem = useCallback((timestamp: number) => {
    if (timestamp - lastSpawnRef.current > 800) {
      lastSpawnRef.current = timestamp;
      const isBad = Math.random() < 0.25;
      setItems((prev) => [
        ...prev,
        {
          id: idRef.current++,
          x: Math.random() * 85 + 5,
          y: -5,
          emoji: isBad ? BAD_EMOJI : EMOJI,
          speed: 1.5 + Math.random() * 2,
          caught: false,
        },
      ]);
    }
  }, [EMOJI, BAD_EMOJI]);

  useEffect(() => {
    if (!started || completed || failed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFailed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed, failed]);

  useEffect(() => {
    if (!started || completed || failed) return;
    let lastTime = 0;
    const loop = (timestamp: number) => {
      if (timestamp - lastTime > 50) {
        lastTime = timestamp;
        spawnItem(timestamp);
        setItems((prev) =>
          prev
            .map((item) => ({ ...item, y: item.y + item.speed }))
            .filter((item) => item.y < 110 && !item.caught)
        );
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, failed, spawnItem]);

  const handleCatch = (id: number, emoji: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, caught: true } : item));
    if (emoji === EMOJI) {
      setScore((s) => {
        const newScore = s + 1;
        if (newScore >= GOAL) {
          setCompleted(true);
          setTimeout(onComplete, 2000);
        }
        return newScore;
      });
    } else {
      setScore((s) => Math.max(0, s - 2));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBasketX(((e.clientX - rect.left) / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBasketX(((e.touches[0].clientX - rect.left) / rect.width) * 100);
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={GOAL}
      timeLeft={timeLeft}
      hintText={`${EMOJI}를 받으면 +1점, ${BAD_EMOJI}는 피해! ${GOAL}개 모으면 클리어! 🐻`}
      showBite={failed && !completed}
      onRetry={() => { setScore(0); setTimeLeft(TIME); setItems([]); setFailed(false); setStarted(false); }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">{EMOJI}</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                {isJeju ? "제주 감귤 수확!" : "생일 케이크 받기!"}
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                {isJeju
                  ? "떨어지는 감귤을 받아봐! 파도는 피해야 해 🌊"
                  : "생일 케이크 재료를 받아봐! 💔는 피해야 해!"}
                <br />목표: {GOAL}개 / 30초
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <div
            ref={gameAreaRef}
            className="relative w-full max-w-md flex-1 rounded-2xl overflow-hidden cursor-none"
            style={{ minHeight: "400px", background: "rgba(0,0,0,0.2)", border: "2px solid oklch(1 0 0 / 20%)", touchAction: "none" }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onTouchStart={(e) => e.preventDefault()}
          >
            {/* 떨어지는 아이템들 */}
            {items.map((item) => (
              <button
                key={item.id}
                className="absolute text-3xl transition-none select-none"
                style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => handleCatch(item.id, item.emoji)}
              >
                {item.emoji}
              </button>
            ))}

            {/* 바구니 */}
            <div
              className="absolute bottom-4 text-4xl transition-none select-none pointer-events-none"
              style={{ left: `${basketX}%`, transform: "translateX(-50%)" }}
            >
              🧺
            </div>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">{EMOJI}</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                {isJeju ? "감귤 수확 완료!" : "케이크 완성!"}
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
                {isJeju ? "제주도 여행 최고였어! 🍊" : "생일 축하해 진성아! 🎂"}
              </p>
            </div>
          </div>
        )}

      </div>
    </GameLayout>
  );
}
