// Stage 1: 합정 소개팅 - 영서 취향 맞추기 퀴즈
// 디자인: 네이비 밤하늘 + 전구 + 골드 포인트 (레퍼런스 스타일)
// 호감도 시스템: 정답 +25, 오답 -10, 80점 이상 통과 (시작: 50점)

import { useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

const PASS_SCORE = 80;
const MAX_SCORE = 100;
const CORRECT_SCORE = 25;
const WRONG_SCORE = -10;
const START_SCORE = 50;

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  correctComment: string;
  wrongComment: string;
}

const QUESTIONS: Question[] = [
  {
    question: "영서가 좋아하는 색은?",
    options: ["분홍색", "보라색", "파란색", "연두색"],
    correctIndex: 2,
    correctComment: "맞아! 파란색이 제일 좋아 💙",
    wrongComment: "땡! 몰랐단 말인가~?😅",
  },
  {
    question: "영서의 이상형 리스트 중 해당되지 않는 것은?",
    options: [
      "잘 웃고 웃는 게 예쁜 사람",
      "솔직한 사람",
      "자기주장이 강하지 않은 사람",
      "잘 먹는 사람",
    ],
    correctIndex: 1,
    correctComment: "맞았어! 내 이상형 리스트에 솔직한 사람은 따로 없었어 🎯",
    wrongComment: "아니야~ 솔직한 사람도 좋지만 이상형까지는? 😄",
  },
  {
    question: "상화가 영서에게 전달해준 내용이 아닌 것은?",
    options: [
      "교회를 다니는 사람이었으면 좋겠음",
      "호모포비아가 아니어야 함",
      "세종에서 일하고 싶음",
      "클라이밍을 좋아함",
    ],
    correctIndex: 3,
    correctComment: "맞아! 진성이의 클라이밍 사랑은 소개팅하면서 알게 되었지? ✅",
    wrongComment: "일부러 틀렸지?! 🤔",
  },
  {
    question: "다섯 가지 사랑의 언어 중 영서에게 가장 중요한 것은?",
    options: ["함께하는 시간", "선물", "봉사", "인정"],
    correctIndex: 0,
    correctComment: "맞았어~ 함께하는 시간이 제일 소중해 🥰",
    wrongComment: "아쉬워~ 함께하는 시간이 제일 중요해 💕",
  },
];

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function GameChat({ stage, onComplete }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [affection, setAffection] = useState(START_SCORE);
  const [showBite, setShowBite] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [passed, setPassed] = useState(false);

  const current = QUESTIONS[questionIndex];

  const handleSelect = (optionIndex: number) => {
    if (selectedOption !== null) return;

    const correct = optionIndex === current.correctIndex;
    setSelectedOption(optionIndex);
    setIsCorrect(correct);

    const newAffection = Math.max(0, Math.min(MAX_SCORE, affection + (correct ? CORRECT_SCORE : WRONG_SCORE)));
    setAffection(newAffection);
    setComment(correct ? current.correctComment : current.wrongComment);

    if (!correct) {
      setShowBite(true);
    }

    setTimeout(() => {
      setShowBite(false);
      if (questionIndex < QUESTIONS.length - 1) {
        setQuestionIndex(questionIndex + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setComment("");
      } else {
        setGameOver(true);
        if (newAffection >= PASS_SCORE) {
          setPassed(true);
          setTimeout(onComplete, 2500);
        }
      }
    }, 1800);
  };

  const handleRetry = () => {
    setQuestionIndex(0);
    setAffection(START_SCORE);
    setShowBite(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setComment("");
    setGameOver(false);
    setPassed(false);
  };

  return (
    <GameLayout
      stage={stage}
      score={affection}
      maxScore={MAX_SCORE}
      hintText="영서의 취향을 잘 파악해봐! 정답 +25점, 오답 -10점 🎯"
      showBite={showBite && !gameOver}
      onBiteEnd={() => setShowBite(false)}
      onRetry={handleRetry}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">
        {/* 호감도 바 */}
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
            <span>💕 호감도</span>
            <span style={{ color: affection >= PASS_SCORE ? "oklch(0.78 0.14 55)" : "oklch(0.90 0.05 60)" }}>
              {affection}점 {affection >= PASS_SCORE ? "✨" : `(통과 기준: ${PASS_SCORE}점)`}
            </span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${affection}%`,
                background: affection >= PASS_SCORE
                  ? "linear-gradient(90deg, oklch(0.72 0.18 140), oklch(0.78 0.14 55))"
                  : "linear-gradient(90deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))",
              }}
            />
          </div>
          {/* 통과 기준선 */}
          <div className="relative h-2">
            <div
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${PASS_SCORE}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-0.5 h-2" style={{ background: "oklch(0.78 0.14 55 / 0.8)" }} />
            </div>
          </div>
        </div>

        {/* 문제 카드 */}
        {!gameOver && (
          <div className="w-full max-w-md card-glow p-5 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.72 0.12 350 / 0.2)", color: "oklch(0.72 0.12 350)" }}>
                Q{questionIndex + 1} / {QUESTIONS.length}
              </span>
              <span className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>
                80점 이상이면 통과!
              </span>
            </div>

            <p className="text-sm font-bold mb-4 text-center leading-relaxed" style={{ color: "oklch(0.90 0.05 60)", fontFamily: "'Gowun Dodum', sans-serif" }}>
              {current.question}
            </p>

            {/* 정오답 코멘트 */}
            {comment && (
              <div
                className="mb-3 p-2 rounded-xl text-center text-sm animate-bounce-in"
                style={{
                  background: isCorrect ? "oklch(0.72 0.18 140 / 0.2)" : "oklch(0.72 0.12 350 / 0.2)",
                  color: isCorrect ? "oklch(0.72 0.18 140)" : "oklch(0.72 0.12 350)",
                  border: `1px solid ${isCorrect ? "oklch(0.72 0.18 140 / 0.4)" : "oklch(0.72 0.12 350 / 0.4)"}`,
                }}
              >
                {isCorrect ? "✅ " : "❌ "}{comment}
              </div>
            )}

            {/* 선택지 */}
            <div className="flex flex-col gap-2">
              {current.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isAnswer = selectedOption !== null && i === current.correctIndex;
                const isWrong = isSelected && !isCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selectedOption !== null}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isAnswer
                        ? "oklch(0.72 0.18 140 / 0.25)"
                        : isWrong
                        ? "oklch(0.72 0.12 350 / 0.25)"
                        : "oklch(0.22 0.06 275 / 0.8)",
                      border: isAnswer
                        ? "1px solid oklch(0.72 0.18 140 / 0.7)"
                        : isWrong
                        ? "1px solid oklch(0.72 0.12 350 / 0.7)"
                        : "1px solid oklch(1 0 0 / 15%)",
                      color: "oklch(0.90 0.05 60)",
                      opacity: selectedOption !== null && !isSelected && !isAnswer ? 0.45 : 1,
                      fontFamily: "'Gowun Dodum', sans-serif",
                    }}
                  >
                    <span className="mr-2 text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>
                      {["①", "②", "③", "④"][i]}
                    </span>
                    {opt}
                    {isAnswer && selectedOption !== null && " ✅"}
                    {isWrong && " ❌"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 실패 화면 */}
        {gameOver && !passed && (
          <div className="w-full max-w-md card-glow p-6 text-center animate-bounce-in">
            <div className="text-4xl mb-3">😤</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.72 0.12 350)", fontFamily: "'Gowun Dodum', sans-serif" }}>
              호감도가 부족해!
            </h2>
            <p className="text-sm mb-4" style={{ color: "oklch(0.80 0.05 60)" }}>
              최종 호감도 {affection}점 — 80점이 넘어야 해 💦
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))",
                color: "white",
                fontFamily: "'Gowun Dodum', sans-serif",
              }}
            >
              다시 도전하기 🔄
            </button>
          </div>
        )}

        {/* 성공 팝업 */}
        {gameOver && passed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm mx-4">
              <div className="text-5xl mb-3">💕</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                소개팅 성공!
              </h2>
              <p className="text-sm" style={{ color: "oklch(0.90 0.05 60)" }}>
                호감도 {affection}점! 진성이가 영서 취향을 잘 알고 있었네 🥰
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
