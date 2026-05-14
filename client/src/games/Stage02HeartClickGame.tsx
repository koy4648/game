/*
 * Stage 2 - 시청 고백: 만난 횟수만큼 하트 누르기
 * 5초가 끝났을 때 정확히 7번 눌렀으면 통과, 더 누르거나 덜 누르면 실패.
 */
import { useState, useEffect, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage02HeartClickGame({ stage, onComplete }: Props) {
  const GOAL = 7;
  const TIME_LIMIT = 5;
  const [hearts, setHearts] = useState(0);
  const [floating, setFloating] = useState<FloatingHeart[]>([]);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [resultMessage, setResultMessage] = useState("");
  const idRef = useRef(0);

  useEffect(() => {
    if (!started || completed || failed) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer);
          setHearts((currentHearts) => {
            if (currentHearts === GOAL) {
              setCompleted(true);
              setResultMessage("정확히 7번! 우리 만난 횟수 딱 맞췄다 💕");
              setTimeout(onComplete, 2200);
            } else {
              setFailed(true);
              setResultMessage(`${currentHearts}번 눌렀어.다시 생각해봐ㅠ`);
            }
            return currentHearts;
          });
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, failed, onComplete]);

  const resetGame = () => {
    setHearts(0);
    setFloating([]);
    setCompleted(false);
    setFailed(false);
    setStarted(false);
    setTimeLeft(TIME_LIMIT);
    setResultMessage("");
  };

  const handleClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!started || completed || failed) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newId = idRef.current++;
    setFloating((prev) => [...prev, { id: newId, x, y }]);
    setTimeout(() => setFloating((prev) => prev.filter((h) => h.id !== newId)), 1000);

    setHearts((h) => {
      const newH = h + 1;
      if (newH > GOAL) {
        setFailed(true);
        setResultMessage("앗, 너무 많이 눌렀어! 몇번인지 다시 생각해 봐.");
      }
      return newH;
    });
  };

  const progress = Math.min(100, (hearts / GOAL) * 100);

  return (
    <GameLayout
      stage={stage}
      score={hearts}
      maxScore={GOAL}
      timeLeft={started && !completed && !failed ? timeLeft : undefined}
      hintText="2025년 3월 3일까지 만난 횟수만큼만 눌러줘. 정확히 7번! 더 눌러도 실패야 💕"
      showBite={failed && !completed}
      onRetry={resetGame}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-float">💑</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                시청 광장에서 고백!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                25년 3월 3일까지<br />
                영서와 진성이가 만난 횟수만큼<br />
                하트를 눌러줘~
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>5초 시작!</button>
            </div>
          </div>
        ) : (
          <>
            {/* 진행 바 */}
            <div className="w-full max-w-md mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                <span>💕 누른 하트</span>
                <span>정답: 정확히 {GOAL}번</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))",
                    boxShadow: "0 0 10px oklch(0.72 0.12 350 / 0.6)",
                  }}
                />
              </div>
            </div>

            {/* 클릭 영역 */}
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden select-none"
              style={{
                minHeight: "350px",
                background: "rgba(0,0,0,0.15)",
                border: "2px solid oklch(0.72 0.12 350 / 0.4)",
                cursor: completed || failed ? "default" : "pointer",
                touchAction: "none",
              }}
              onPointerDown={handleClick}
            >
              {/* 중앙 하트 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="text-8xl transition-all duration-200"
                  style={{ transform: `scale(${0.8 + (hearts / GOAL) * 0.5})`, filter: `hue-rotate(${hearts * 2}deg)` }}
                >
                  💗
                </div>
              </div>

              {/* 목표 텍스트 */}
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-sm font-bold" style={{ color: "oklch(0.90 0.05 60)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                  {resultMessage || `${timeLeft}초 안에 정확히 누르기! 지금 ${hearts}번`}
                </p>
              </div>

              {/* 플로팅 하트들 */}
              {floating.map((h) => (
                <div
                  key={h.id}
                  className="absolute pointer-events-none text-2xl"
                  style={{
                    left: h.x,
                    top: h.y,
                    animation: "heart-float 1s ease-out forwards",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  💕
                </div>
              ))}
            </div>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">💑</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                정확히 기억했다! 🎉
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
              총 7번 만나고 사귀기로 했지 💕
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
