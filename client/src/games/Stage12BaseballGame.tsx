/*
 * Stage 12 - 잠실 야구장: 홈런 타격 타이밍 게임
 * 공이 스트라이크 존에 들어올 때 탭하면 홈런!
 * 3번 홈런 치면 클리어!
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type SwingResult = "homerun" | "hit" | "miss" | "strike" | null;

export default function Stage12BaseballGame({ stage, onComplete }: Props) {
  const GOAL_HOMERUNS = 3;
  const [homeruns, setHomeruns] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [ballX, setBallX] = useState(-10); // -10 = 대기, 0~100 = 날아오는 중
  const [ballActive, setBallActive] = useState(false);
  const [swingResult, setSwingResult] = useState<SwingResult>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const ballRef = useRef(-10);
  const animRef = useRef<number>(0);
  const speedRef = useRef(2.5);

  const throwBall = useCallback(() => {
    if (ballActive) return;
    setBallActive(true);
    ballRef.current = 0;
    speedRef.current = 2.5 + Math.random() * 1.5;
    setSwingResult(null);

    const loop = () => {
      ballRef.current += speedRef.current;
      setBallX(ballRef.current);

      if (ballRef.current > 110) {
        // 공이 지나감 → 스트라이크
        setBallActive(false);
        setSwingResult("strike");
        setStrikes((s) => {
          const ns = s + 1;
          if (ns >= 3) setGameOver(true);
          return ns;
        });
        setTimeout(() => {
          setSwingResult(null);
          setBallX(-10);
          if (strikes < 2) setTimeout(throwBall, 1000);
        }, 1000);
        return;
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [ballActive, strikes]);

  useEffect(() => {
    if (!started || completed || gameOver) return;
    const timeout = setTimeout(throwBall, 800);
    return () => clearTimeout(timeout);
  }, [started, completed, gameOver]);

  const swing = useCallback(() => {
    if (!ballActive || !started || completed || gameOver) return;
    cancelAnimationFrame(animRef.current);
    const pos = ballRef.current;
    setBallActive(false);

    let result: SwingResult;
    if (pos >= 40 && pos <= 65) {
      result = "homerun";
      setHomeruns((h) => {
        const nh = h + 1;
        if (nh >= GOAL_HOMERUNS) {
          setCompleted(true);
          setTimeout(onComplete, 2500);
        }
        return nh;
      });
    } else if (pos >= 30 && pos <= 75) {
      result = "hit";
    } else {
      result = "miss";
      setStrikes((s) => {
        const ns = s + 1;
        if (ns >= 3) setGameOver(true);
        return ns;
      });
    }
    setSwingResult(result);
    setTimeout(() => {
      setSwingResult(null);
      setBallX(-10);
      if (!completed && !gameOver) setTimeout(throwBall, 1000);
    }, 1200);
  }, [ballActive, started, completed, gameOver, onComplete, throwBall]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); swing(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [swing]);

  const resultColors: Record<string, string> = {
    homerun: "oklch(0.78 0.14 55)",
    hit: "oklch(0.65 0.18 145)",
    miss: "oklch(0.72 0.12 350)",
    strike: "oklch(0.72 0.12 350)",
  };
  const resultText: Record<string, string> = {
    homerun: "🏆 홈런!",
    hit: "✅ 안타!",
    miss: "❌ 헛스윙!",
    strike: "⚡ 스트라이크!",
  };

  // 두산 베어스 실제 응원 문구
  const cheerMessages = [
    "두산 베어스 파이팅! 🐻",
    "오오오오 두산! 🎉",
    "베어스 홈런! ⚾",
    "잠실의 주인 두산! 🏟️",
  ];
  const [cheerIdx] = useState(() => Math.floor(Math.random() * cheerMessages.length));

  return (
    <GameLayout
      stage={stage}
      score={homeruns}
      maxScore={GOAL_HOMERUNS}
      hintText="공이 가운데 들어올 때 탭하면 홈런! 너무 일찍 치면 헛스윙이야 ⚾ 🐻"
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">⚾</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                잠실 야구장! 두산 파이팅! 🐻
              </h2>
              <p className="text-xs mb-2" style={{ color: "oklch(0.72 0.12 350)" }}>
                {cheerMessages[cheerIdx]}
              </p>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                공이 스트라이크 존에 들어올 때<br />
                탭 또는 스페이스바로 스윙!<br />
                홈런 {GOAL_HOMERUNS}개 치면 클리어! ⚾
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <>
            {/* 스코어 */}
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <p className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>홈런</p>
                <p className="text-2xl font-bold" style={{ color: "oklch(0.78 0.14 55)" }}>
                  {"🏆".repeat(homeruns)}{"⬜".repeat(GOAL_HOMERUNS - homeruns)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>스트라이크</p>
                <p className="text-2xl font-bold" style={{ color: "oklch(0.72 0.12 350)" }}>
                  {"❌".repeat(strikes)}{"⬜".repeat(3 - strikes)}
                </p>
              </div>
            </div>

            {/* 야구장 */}
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden mb-4 select-none"
              style={{ height: "200px", background: "oklch(0.25 0.08 145 / 0.7)", border: "2px solid oklch(0.78 0.14 55 / 0.4)", cursor: "pointer" }}
              onClick={swing}
            >
              {/* 스트라이크 존 표시 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 border-2 border-dashed rounded"
                style={{
                  left: "40%",
                  width: "25%",
                  height: "60%",
                  borderColor: "oklch(0.78 0.14 55 / 0.5)",
                }}
              />
              <div className="absolute top-1 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs" style={{ color: "oklch(0.78 0.14 55 / 0.7)" }}>← 스트라이크 존 →</span>
              </div>

              {/* 공 */}
              {ballX >= 0 && ballX <= 110 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-3xl transition-none"
                  style={{ left: `${ballX}%`, transform: "translate(-50%, -50%)" }}
                >
                  ⚾
                </div>
              )}

              {/* 타자 */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl">
                {swingResult ? "🏏" : "🧍"}
              </div>

              {/* 결과 */}
              {swingResult && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-2xl font-bold animate-bounce-in pointer-events-none"
                  style={{ color: resultColors[swingResult], fontFamily: "'Gowun Dodum', sans-serif" }}
                >
                  {resultText[swingResult]}
                </div>
              )}
            </div>

            <p className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>
              화면 탭 또는 스페이스바로 스윙!
            </p>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">⚾🏆</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                홈런 {GOAL_HOMERUNS}개 달성!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>두산 파이팅! 이제 마지막 미션이야 💕</p>
            </div>
          </div>
        )}
        {gameOver && !completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🐻</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.72 0.12 350)", fontFamily: "'Gowun Dodum', sans-serif" }}>삼진 아웃! 다시?</h2>
              <button className="btn-star mt-4" onClick={() => {
                setHomeruns(0); setStrikes(0); setBallX(-10); setBallActive(false);
                setSwingResult(null); setGameOver(false); setCompleted(false);
                setTimeout(throwBall, 1000);
              }}>다시 하기</button>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
