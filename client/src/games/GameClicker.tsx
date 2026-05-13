/*
 * Stage 3 - 시청 고백: 하트 모으기 클리커 게임
 * 화면을 클릭해서 하트를 100개 모으면 "사귀자!" 완성!
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

export default function GameClicker({ stage, onComplete }: Props) {
  const GOAL = 100;
  const [hearts, setHearts] = useState(0);
  const [floating, setFloating] = useState<FloatingHeart[]>([]);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const idRef = useRef(0);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (completed) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x: number, y: number;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    const newId = idRef.current++;
    setFloating((prev) => [...prev, { id: newId, x, y }]);
    setTimeout(() => setFloating((prev) => prev.filter((h) => h.id !== newId)), 1000);

    setHearts((h) => {
      const newH = h + 1;
      if (newH >= GOAL) {
        setCompleted(true);
        setTimeout(onComplete, 2500);
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
      hintText="화면을 빠르게 클릭하면 하트가 쌓여! 100개 모으면 사귀자! 💕 🐻"
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
                화면을 클릭해서 하트를 100개 모아봐!<br />
                "너도 고민 중인 줄 알았다." 💕
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <>
            {/* 진행 바 */}
            <div className="w-full max-w-md mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                <span>💕 하트</span>
                <span>{hearts} / {GOAL}</span>
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
              style={{ minHeight: "350px", background: "rgba(0,0,0,0.15)", border: "2px solid oklch(0.72 0.12 350 / 0.4)", cursor: "pointer", touchAction: "none" }}
              onClick={handleClick}
              onTouchStart={handleClick}
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
                  {hearts < GOAL ? "탭탭탭! 💕" : "사귀자! 🎉"}
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
                사귀게 됐다! 🎉
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
                "연애하자 해서 연애하게 되었어" 💕
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
