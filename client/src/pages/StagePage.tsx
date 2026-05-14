/*
 * StagePage: /stage/:id 라우트
 * 스테이지 ID에 따라 적절한 미니게임 컴포넌트를 렌더링
 */
import { useParams, useLocation } from "wouter";
import { STAGES, type StageGameType } from "@/contexts/GameContext";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState } from "react";

// 실제 진행에 쓰는 게임 컴포넌트들. 파일명에 Stage 번호와 게임명을 같이 둔다.
import Stage01TasteQuizGame from "@/games/Stage01TasteQuizGame";
import Stage02HeartClickGame from "@/games/Stage02HeartClickGame";
import Stage03EverlandDodgeGame from "@/games/Stage03EverlandDodgeGame";
import Stage04PuzzleGame from "@/games/Stage04PuzzleGame";
import Stage05SpotDifferenceGame from "@/games/Stage05SpotDifferenceGame";
import Stage06PohangScratchGame from "@/games/Stage06PohangScratchGame";
import Stage07RockPaperScissorsStairsGame from "@/games/Stage07RockPaperScissorsStairsGame";
import Stage08RecognizedPersonQuizGame from "@/games/Stage08RecognizedPersonQuizGame";
import Stage09SortBreadRingGame from "@/games/Stage09SortBreadRingGame";
import Stage10SamePhotoMatchGame from "@/games/Stage10SamePhotoMatchGame";
import Stage11DinoRunGame from "@/games/Stage11DinoRunGame";
import Stage12BaseballGame from "@/games/Stage12BaseballGame";

const GAME_MAP: Record<StageGameType, React.ComponentType<{ stage: (typeof STAGES)[0]; onComplete: () => void }>> = {
  tasteQuiz: Stage01TasteQuizGame,          // Stage 1: 합정 취향 맞추기 퀴즈
  heartClick: Stage02HeartClickGame,        // Stage 2: 시청 하트 연타
  everlandDodge: Stage03EverlandDodgeGame,  // Stage 3: 에버랜드 이모지 피하기
  puzzle: Stage04PuzzleGame,                // Stage 4: 제주 4x4 퍼즐
  spotDifference: Stage05SpotDifferenceGame,// Stage 5: 아쿠아리움 틀린그림찾기
  scratchOff: Stage06PohangScratchGame,     // Stage 6: 포항 스크래치 오프
  rpsStairs: Stage07RockPaperScissorsStairsGame, // Stage 7: 칠갑산 가위바위보 계단
  recognizedPersonQuiz: Stage08RecognizedPersonQuizGame, // Stage 8: 진성이를 알아본 사람 퀴즈
  sortBreadRing: Stage09SortBreadRingGame,  // Stage 9: 빵/반지 좌우 분류
  samePhotoMatch: Stage10SamePhotoMatchGame,// Stage 10: 같은 사진 위치 맞추기
  dinoRun: Stage11DinoRunGame,              // Stage 11: 공룡게임 스타일 달리기
  baseball: Stage12BaseballGame,            // Stage 12: 잠실 야구장
};

export default function StagePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { completeStage } = useGame();
  const stageId = parseInt(params.id || "1");
  const stage = STAGES.find((s) => s.id === stageId);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    if (!stage) navigate("/map");
  }, [stage]);

  if (!stage) return null;

  const GameComponent = GAME_MAP[stage.gameType];

  const [showCaricature, setShowCaricature] = useState(false);
  const [caricatureVisible, setCaricatureVisible] = useState(false);

  const handleComplete = () => {
    completeStage(stageId);
    if (stage.caricature) {
      setShowCaricature(true);
      setTimeout(() => setCaricatureVisible(true), 50);
      setTimeout(() => {
        setCaricatureVisible(false);
        setTimeout(() => {
          setShowCaricature(false);
          if (stageId >= STAGES.length) navigate("/quiz");
          else navigate("/map");
        }, 400);
      }, 2800);
    } else {
      if (stageId >= STAGES.length) setTimeout(() => navigate("/quiz"), 1000);
      else setTimeout(() => navigate("/map"), 1000);
    }
  };

  if (!GameComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">게임 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {introVisible ? (
        <StageIntro stage={stage} onStart={() => setIntroVisible(false)} />
      ) : (
        <GameComponent stage={stage} onComplete={handleComplete} />
      )}
      {/* 테스트용 건너뛰기 버튼 */}
      <button
        onClick={handleComplete}
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

      {/* 성공 캐리커처 팝업 */}
      {showCaricature && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "oklch(0.08 0.05 285 / 0.88)",
            backdropFilter: "blur(8px)",
            transition: "opacity 0.4s ease",
            opacity: caricatureVisible ? 1 : 0,
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              position: "absolute",
              fontSize: `${14 + (i % 4) * 6}px`,
              left: `${10 + (i * 11) % 80}%`,
              top: `${10 + (i * 13) % 70}%`,
              animation: `twinkle ${1 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              color: i % 2 === 0 ? "#FFD700" : "#FFB6C1",
              opacity: 0.7,
            }}>
              {i % 3 === 0 ? "✦" : i % 3 === 1 ? "⭐" : "💫"}
            </div>
          ))}
          <div style={{
            background: "oklch(0.14 0.06 275 / 0.95)",
            border: "2px solid oklch(0.78 0.14 55 / 0.8)",
            borderRadius: 24, padding: "28px 36px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            boxShadow: "0 0 60px oklch(0.78 0.14 55 / 0.3), 0 16px 48px rgba(0,0,0,0.5)",
            transform: caricatureVisible ? "scale(1)" : "scale(0.8)",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            maxWidth: 300,
          }}>
            <div style={{ fontFamily: "'Gowun Dodum', sans-serif", fontSize: "1.05rem", color: "oklch(0.78 0.14 55)", fontWeight: 700 }}>
              ✨ {stage.name} 클리어! ✨
            </div>
            <div style={{ width: 150, height: 150, borderRadius: "50%", overflow: "hidden", border: "3px solid oklch(0.78 0.14 55 / 0.9)", boxShadow: "0 0 24px oklch(0.78 0.14 55 / 0.5)", background: "oklch(0.18 0.05 275)" }}>
              <img src={stage.caricature} alt={stage.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.82rem", color: "oklch(0.72 0.12 350)" }}>{stage.date} 💌</div>
            <div style={{ fontFamily: "'Gowun Dodum', sans-serif", fontSize: "0.75rem", color: "oklch(0.50 0.05 280)" }}>잠시 후 지도로 돌아갑니다...</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageIntro({ stage, onStart }: { stage: (typeof STAGES)[0]; onStart: () => void }) {
  const portrait = stage.caricature || "/webdev-static-assets/character-couple-v5.png";

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-5"
      style={{
        background: "oklch(0.09 0.05 285)",
        fontFamily: "'Gowun Dodum', sans-serif",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${stage.bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(0.9)",
          transform: "scale(1.04)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.08 0.05 285 / 0.86), oklch(0.10 0.05 285 / 0.68) 45%, oklch(0.06 0.04 285 / 0.9))",
          backdropFilter: "blur(2px)",
        }}
      />

      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="absolute animate-twinkle pointer-events-none"
          style={{
            left: `${6 + ((i * 17) % 88)}%`,
            top: `${8 + ((i * 23) % 78)}%`,
            color: i % 2 === 0 ? "oklch(0.86 0.13 70)" : "oklch(0.82 0.11 340)",
            opacity: 0.55,
            fontSize: `${10 + (i % 4) * 4}px`,
            animationDelay: `${i * 0.17}s`,
          }}
        >
          ✦
        </span>
      ))}

      <section
        className="relative z-10 w-full max-w-md text-center"
        style={{
          color: "oklch(0.94 0.03 70)",
        }}
      >
        <div
          className="mx-auto mb-4 flex items-center justify-center"
          style={{
            width: "clamp(150px, 44vw, 220px)",
            aspectRatio: "1",
            borderRadius: "50%",
            border: "3px solid oklch(0.78 0.14 55 / 0.88)",
            boxShadow: "0 0 36px oklch(0.78 0.14 55 / 0.36), 0 18px 48px rgba(0,0,0,0.45)",
            background: "oklch(0.16 0.05 275)",
            overflow: "hidden",
          }}
        >
          <img src={portrait} alt={stage.name} className="w-full h-full object-cover" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full"
          style={{
            background: "oklch(0.14 0.05 275 / 0.82)",
            border: "1px solid oklch(0.78 0.14 55 / 0.38)",
          }}
        >
          <span>{stage.emoji}</span>
          <strong style={{ color: "oklch(0.80 0.14 55)" }}>{`Stage ${stage.id}. ${stage.name}`}</strong>
        </div>

        <p
          className="text-sm mb-2"
          style={{ color: "oklch(0.72 0.07 280)", fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          {stage.date} · {stage.description}
        </p>
        <p
          className="text-xl leading-relaxed font-bold mb-7"
          style={{
            textWrap: "balance",
            textShadow: "0 2px 18px rgba(0,0,0,0.45)",
          }}
        >
          {stage.intro}
        </p>

        <button
          onClick={onStart}
          className="btn-star min-w-40"
          style={{
            fontSize: "1rem",
            padding: "12px 28px",
            boxShadow: "0 0 22px oklch(0.78 0.14 55 / 0.34)",
          }}
        >
          다음으로
        </button>
      </section>
    </div>
  );
}
