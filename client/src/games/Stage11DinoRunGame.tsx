/*
 * Stage 11 - 보성 녹차마라톤: 공룡게임 스타일 달리기 틀
 * TODO: 캐릭터 점프/장애물/에너지 gel/52.195점 클리어 로직을 구현한다.
 */
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  return (
    <GameLayout
      stage={stage}
      score={0}
      maxScore={52195}
      hintText="공룡게임처럼 달리며 장애물을 넘고 에너지 젤을 먹는 게임 자리입니다."
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="card-glow p-6 text-center max-w-2xl w-full">
          <div className="text-5xl mb-3">🏃</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            Stage 11: 공룡 달리기
          </h2>
          <div className="relative h-40 rounded-lg overflow-hidden my-5" style={{ background: "linear-gradient(180deg, oklch(0.80 0.08 190), oklch(0.55 0.12 145))" }}>
            <div style={{ position: "absolute", left: 24, bottom: 24, fontSize: 42 }}>🏃‍♀️</div>
            <div style={{ position: "absolute", left: "48%", bottom: 24, fontSize: 32 }}>🪨</div>
            <div style={{ position: "absolute", right: 34, bottom: 30, fontSize: 28 }}>⚡</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, height: 4, background: "oklch(0.22 0.07 130 / 0.75)" }} />
          </div>
          <p className="text-sm mb-5" style={{ color: "oklch(0.90 0.05 60)" }}>
            영서 10km + 진성이 42.195km, 총 52.195km 목표 자리입니다.
          </p>
          <button className="btn-star" onClick={onComplete}>
            틀 확인 완료
          </button>
        </div>
      </div>
    </GameLayout>
  );
}
