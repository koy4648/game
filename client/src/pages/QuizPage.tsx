/*
 * QuizPage.tsx — 영서 & 진성 추억 퀴즈
 * 디자인: 별빛 동화 테마, 슬라이드 전환 퀴즈
 * 영서(여자친구) → 진성(남자친구) 프로포즈 사이트
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/contexts/GameContext";

const quizzes = [
  // ── 우리 이야기 퀴즈 ──
  {
    category: "우리 이야기 💑",
    question: "영서와 진성이 처음 소개팅을 한 식당 이름은?",
    options: ["스케쥴합정", "문래식당", "시청한우", "신촌포차"],
    answer: 0,
    emoji: "🍽️",
    explanation: "맞아! 합정에 있는 스케쥴합정에서 처음 만났지 😊",
  },
  {
    category: "우리 이야기 💑",
    question: "소개팅 다음날, 진성이의 생일에 두 사람이 만난 동네는?",
    options: ["합정", "신촌", "문래", "시청"],
    answer: 2,
    emoji: "🎂",
    explanation: "문래에서 저녁 먹고 카페도 갔었지! 생일에 만나줘서 고마워 🎉",
  },
  {
    category: "우리 이야기 💑",
    question: "두 사람이 공식적으로 사귀기로 한 날짜는?",
    options: ["2025년 1월 17일", "2025년 2월 1일", "2025년 3월 3일", "2025년 3월 14일"],
    answer: 2,
    emoji: "💑",
    explanation: "3월 3일 시청에서! '연애하자 해서 연애하게 되었어' 💕",
  },
  {
    category: "우리 이야기 💑",
    question: "영서가 유럽여행에서 돌아와 진성이와 다시 만난 날은?",
    options: ["1월 25일", "2월 1일", "2월 14일", "3월 1일"],
    answer: 1,
    emoji: "✈️",
    explanation: "2월 1일에 다시 만났는데, 그때 진성이가 고백했었지 ㅋㅋ",
  },
  {
    category: "우리 이야기 💑",
    question: "두 사람이 함께 가지 않은 여행지는?",
    options: ["제주도", "부산", "포항", "보성"],
    answer: 1,
    emoji: "🗺️",
    explanation: "부산은 아직! 에버랜드, 제주도, 포항, 영덕, 대전, 공주, 청주, 보성은 갔어 🌏",
  },
  {
    category: "우리 이야기 💑",
    question: "대전 1주년 기념으로 간 유명한 빵집은?",
    options: ["뚜레쥬르", "파리바게뜨", "성심당", "이성당"],
    answer: 2,
    emoji: "🍓",
    explanation: "성심당에서 딸기요거롤 먹고 커플링도 맞췄지! 💍",
  },
  // ── 진성 알아보기 ──
  {
    category: "진성이 알아보기 🏃",
    question: "진성이가 월수금에 하는 운동은?",
    options: ["러닝", "수영", "등산", "클라이밍"],
    answer: 1,
    emoji: "🏊",
    explanation: "월수금은 수영! 화목은 러닝이야 💪",
  },
  {
    category: "진성이 알아보기 🏃",
    question: "진성이가 영서한테 자주 하는 말은?",
    options: ["밥 먹었어?", "왜 이렇게 예쁘냐", "오늘 뭐 해?", "잘 자"],
    answer: 1,
    emoji: "😍",
    explanation: "자꾸 왜 이렇게 예쁘냐고 해~ 헤헤 🥰",
  },
  {
    category: "진성이 알아보기 🏃",
    question: "진성이가 좋아하는 음식 카테고리는?",
    options: ["고기", "탄수화물", "해산물", "채소"],
    answer: 1,
    emoji: "🍚",
    explanation: "밥, 탄수화물을 좋아해! 취향이 잘 맞지 😋",
  },
  {
    category: "진성이 알아보기 🏃",
    question: "진성이가 좋아하는 취미 중 잘은 못하는 것은?",
    options: ["수영", "러닝", "클라이밍", "등산"],
    answer: 2,
    emoji: "🧗",
    explanation: "클라이밍을 좋아하는데 잘은 못한대 ㅋㅋ 귀엽지? 🐻",
  },
  // ── 영서 알아보기 ──
  {
    category: "영서 알아보기 ⚾",
    question: "다음 보기 중 영서가 가장 좋아하는 꽃을 고르시오",
    options: ["델피늄", "수국", "리시안셔스", "해바라기"],
    answer: 1,
    emoji: "💐",
    explanation: "수국이 제일 좋아! 예쁘지? 🌸",
  },
  {
    category: "영서 알아보기 ⚾",
    question: "다음 보기 중 영서가 투자하고 있지 않은 종목을 고르시오",
    options: ["일라이릴리", "엔비디아", "SPLG", "KRX 금현물"],
    answer: 2,
    emoji: "📈",
    explanation: "SPLG는 투자 안 해! 일라이릴리, 엔비디아, KRX 금현물은 하고 있어 💰",
  },
  {
    category: "영서 알아보기 ⚾",
    question: "다음 보기 중 영서가 해보지 않은 직책을 고르시오",
    options: ["회장", "부회장", "기장단", "과대"],
    answer: 3,
    emoji: "🎓",
    explanation: "과대는 안 해봤어! 회장, 부회장, 기장단은 다 해봤지 😎",
  },
  {
    category: "영서 알아보기 ⚾",
    question: "영서는 25-1에 어디 소속이었을까요?",
    options: ["데이터사이언스인공지능학과", "AI융합전공", "인공지능컴퓨팅학과", "컴퓨터소프트웨어학과"],
    answer: 0,
    emoji: "🎓",
    explanation: "데이터사이언스인공지능학과! 연세대 다니는 영서 😊",
  },
  {
    category: "영서 알아보기 ⚾",
    question: "영서가 좋아하는 산리오 캐릭터는?",
    options: ["마이멜로디", "시나모롤", "포차코", "쿠로미"],
    answer: 2,
    emoji: "🐶",
    explanation: "포차코를 제일 좋아해! 귀엽지? 🐾",
  },
  {
    category: "영서 알아보기 ⚾",
    question: "영서가 좋아하는 음료는?",
    options: ["아이스 아메리카노", "아이스 바닐라 라테", "밀크티", "딸기 스무디"],
    answer: 1,
    emoji: "☕",
    explanation: "아이스 바닐라 라테! 밀크티도 좋아해 🧋",
  },
  // ── 여행 퀴즈 ──
  {
    category: "우리 여행 🗺️",
    question: "두 사람이 400일 기념으로 찍은 스냅 사진의 배경은?",
    options: ["단풍", "벚꽃", "눈꽃", "해바라기밭"],
    answer: 1,
    emoji: "🌸",
    explanation: "400일 기념 벚꽃 스냅! 너무 예뻤지 🌸",
  },
  {
    category: "우리 여행 🗺️",
    question: "보성에서 함께 참가한 이벤트는?",
    options: ["녹차 체험", "녹차마라톤", "불꽃축제", "해돋이 행사"],
    answer: 1,
    emoji: "🍵",
    explanation: "5월에 보성 녹차마라톤 같이 갔어! 🏃",
  },
];

export default function QuizPage() {
  const [, navigate] = useLocation();
  const { completeQuiz } = useGame();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const quiz = quizzes[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === quiz.answer) setScore((s) => s + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    if (current < quizzes.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      completeQuiz();
    }
  };

  const progress = ((current + 1) / quizzes.length) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ zIndex: 1 }}>
      <div className="fixed inset-0" style={{
        backgroundImage: "url(/webdev-static-assets/hero-night-sky.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />
      <div className="fixed inset-0" style={{ background: "oklch(0.10 0.04 280 / 0.7)" }} />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-6 max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-4 animate-slide-up w-full">
          <h1 className="text-2xl font-bold text-[oklch(0.78_0.14_55)]" style={{ fontFamily: "'Gowun Dodum', sans-serif" }}>
            💫 우리 이야기 퀴즈
          </h1>
          <p className="text-xs text-[oklch(0.70_0.05_280)] mt-1">
            {current + 1} / {quizzes.length} — {quiz.category}
          </p>
        </div>

        {/* 진행 바 */}
        <div className="w-full mb-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))" }}
            />
          </div>
        </div>

        {/* 퀴즈 카드 */}
        {!finished && (
          <div className="w-full card-glow p-5 animate-slide-up">
            <div className="text-4xl text-center mb-3">{quiz.emoji}</div>
            <p className="text-base font-bold text-center mb-4" style={{ color: "oklch(0.95 0.01 60)", fontFamily: "'Gowun Dodum', sans-serif" }}>
              {quiz.question}
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {quiz.options.map((opt, i) => {
                let bg = "oklch(0.22 0.06 275 / 0.8)";
                let border = "1px solid oklch(1 0 0 / 15%)";
                let color = "oklch(0.90 0.05 60)";
                if (selected !== null) {
                  if (i === quiz.answer) { bg = "oklch(0.55 0.18 145 / 0.3)"; border = "1px solid oklch(0.55 0.18 145)"; }
                  else if (i === selected && selected !== quiz.answer) { bg = "oklch(0.72 0.12 350 / 0.3)"; border = "1px solid oklch(0.72 0.12 350)"; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all hover:scale-[1.01]"
                    style={{ background: bg, border, color }}
                  >
                    <span className="font-bold mr-2" style={{ color: "oklch(0.78 0.14 55)" }}>{["①", "②", "③", "④"][i]}</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* 설명 */}
            {showResult && (
              <div
                className="p-3 rounded-xl text-sm text-center animate-bounce-in"
                style={{
                  background: selected === quiz.answer ? "oklch(0.55 0.18 145 / 0.2)" : "oklch(0.72 0.12 350 / 0.2)",
                  border: `1px solid ${selected === quiz.answer ? "oklch(0.55 0.18 145 / 0.5)" : "oklch(0.72 0.12 350 / 0.5)"}`,
                  color: "oklch(0.90 0.05 60)",
                }}
              >
                {selected === quiz.answer ? "✅ 정답!" : "❌ 오답!"} {quiz.explanation}
              </div>
            )}

            {showResult && (
              <button className="btn-star w-full mt-3" onClick={handleNext}>
                {current < quizzes.length - 1 ? "다음 문제 →" : "결과 보기 🎉"}
              </button>
            )}
          </div>
        )}

        {/* 완료 화면 */}
        {finished && (
          <div className="w-full card-glow p-8 text-center animate-bounce-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
              퀴즈 완료!
            </h2>
            <p className="text-lg mb-2" style={{ color: "oklch(0.90 0.05 60)" }}>
              {quizzes.length}문제 중 <span style={{ color: "oklch(0.78 0.14 55)", fontWeight: "bold" }}>{score}개</span> 정답!
            </p>
            <p className="text-sm mb-6" style={{ color: "oklch(0.70 0.05 280)" }}>
              {score >= 15 ? "우리 이야기를 정말 잘 알고 있네 💕" :
               score >= 10 ? "꽤 잘 알고 있어! 조금 더 알아가자 😊" :
               "아직 더 알아갈 게 많아! 같이 추억 쌓자 🌟"}
            </p>
            <button className="btn-star" onClick={() => navigate("/ending")}>
              마지막 미션으로 💌
            </button>
          </div>
        )}
      </div>

      {/* 테스트용 건너뛰기 버튼 */}
      {!finished && (
        <button
          onClick={() => { completeQuiz(); navigate("/ending"); }}
          className="fixed bottom-4 right-4 z-50 text-xs px-3 py-1.5 rounded-full transition-opacity opacity-40 hover:opacity-90 active:opacity-100"
          style={{
            background: "oklch(0.18 0.04 280 / 0.85)",
            border: "1px solid oklch(0.45 0.05 280 / 0.6)",
            color: "oklch(0.65 0.05 280)",
            backdropFilter: "blur(6px)",
          }}
        >
          건너뛰기 ›
        </button>
      )}
    </div>
  );
}
