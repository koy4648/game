/*
 * Stage 4 - 에버랜드: 회사 연락 차단 게임
 * 에버랜드에서 진성이 회사 연락이 계속 와서 정신없었던 에피소드!
 * 날아오는 회사 연락(📱💼📧)은 탭해서 차단, 하트(💕)는 탭해서 모으기!
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface FlyingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  isWork: boolean;
  speed: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function GameRunner({ stage, onComplete }: Props) {
  const GOAL_HEARTS = 20;
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<FlyingItem[]>([]);
  const [hearts, setHearts] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [completed, setCompleted] = useState(false);
  const idRef = useRef(0);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);
  const completedRef = useRef(false);

  const workEmojis = ["📱", "💼", "📧", "📊", "💻", "📞"];
  const heartEmojis = ["💕", "🌸", "⭐", "💖"];

  const spawnItem = useCallback((): FlyingItem => {
    const isWork = Math.random() < 0.65;
    const emoji = isWork
      ? workEmojis[Math.floor(Math.random() * workEmojis.length)]
      : heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    return {
      id: idRef.current++,
      x: 8 + Math.random() * 84,
      y: -10,
      emoji,
      isWork,
      speed: 0.25 + Math.random() * 0.35,
    };
  }, []);

  useEffect(() => {
    if (!started || completed) return;
    const loop = () => {
      frameRef.current++;
      if (frameRef.current % 35 === 0) {
        setItems((prev) => [...prev, spawnItem()]);
      }
      setItems((prev) =>
        prev
          .map((item) => ({ ...item, y: item.y + item.speed }))
          .filter((item) => item.y <= 110)
      );
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, spawnItem]);

  const handleTap = useCallback(
    (itemId: number, isWork: boolean) => {
      if (completedRef.current) return;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      if (isWork) {
        setBlocked((b) => b + 1);
      } else {
        setHearts((h) => {
          const newH = h + 1;
          if (newH >= GOAL_HEARTS && !completedRef.current) {
            completedRef.current = true;
            setCompleted(true);
            setTimeout(onComplete, 2000);
          }
          return newH;
        });
      }
    },
    [onComplete]
  );

  const progress = Math.min(100, (hearts / GOAL_HEARTS) * 100);

  return (
    <GameLayout
      stage={stage}
      score={hearts}
      maxScore={GOAL_HEARTS}
      hintText="📱 회사 연락은 탭해서 차단! 💕 하트는 탭해서 모아! 하트 20개 모으면 클리어~"
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">🎢</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                에버랜드인데... 회사 연락이?!
              </h2>
              <p className="text-sm mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                에버랜드 데이트 중에 진성이 폰에
                <br />
                회사 연락이 계속 왔었잖아 😤
              </p>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                📱 회사 연락은 탭해서 차단!
                <br />
                💕 하트는 모아서 데이트에 집중!
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>
                시작!
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 진행 바 */}
            <div className="w-full max-w-md mb-2">
              <div
                className="flex justify-between text-xs mb-1"
                style={{ color: "oklch(0.90 0.05 60)" }}
              >
                <span>💕 하트 모음</span>
                <span>
                  {hearts} / {GOAL_HEARTS}
                </span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))",
                  }}
                />
              </div>
            </div>

            {/* 스탯 */}
            <div
              className="flex gap-6 mb-2 text-xs"
              style={{ color: "oklch(0.90 0.05 60)" }}
            >
              <span>📱 차단: {blocked}</span>
              <span>💕 모음: {hearts}</span>
            </div>

            {/* 게임 영역 */}
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                height: "260px",
                background: "rgba(0,0,0,0.25)",
                border: "2px solid oklch(1 0 0 / 20%)",
                touchAction: "none",
              }}
            >
              <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.90 0.05 60 / 0.7)" }}
                >
                  📱 차단! &nbsp;💕 모으기!
                </span>
              </div>

              {items.map((item) => (
                <button
                  key={item.id}
                  className="absolute text-3xl hover:scale-125 active:scale-90 transition-transform"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: "translate(-50%, -50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    filter: item.isWork
                      ? "drop-shadow(0 0 6px rgba(255,100,100,0.8))"
                      : "drop-shadow(0 0 6px rgba(255,150,200,0.8))",
                    zIndex: 10,
                  }}
                  onClick={() => handleTap(item.id, item.isWork)}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🎢💕</div>
              <h2
                className="text-xl font-bold"
                style={{
                  color: "oklch(0.78 0.14 55)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                }}
              >
                회사 연락 다 차단!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
                에버랜드 데이트 성공 🎠
                <br />
                다음은 코엑스 아쿠아리움! 🐠
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
