/*
 * Stage 9 - 대전 1주년: 빵/반지 좌우 분류 게임 틀
 * TODO: 컨베이어에서 오는 딸기요거롤은 왼쪽, 반지는 오른쪽으로 보내는 실제 분류 로직을 구현한다.
 */
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage09SortBreadRingGame({ stage, onComplete }: Props) {
  return (
    <GameLayout
      stage={stage}
      score={0}
      maxScore={20}
      hintText="딸기요거롤은 왼쪽, 반지는 오른쪽으로 보내는 분류 게임 자리입니다."
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="card-glow p-6 text-center max-w-lg w-full">
          <div className="text-5xl mb-3">🍓 💍</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            Stage 9: 빵/반지 분류
          </h2>
          <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 items-center my-6">
            <div className="rounded-lg py-4" style={{ background: "oklch(0.22 0.08 25 / 0.75)", color: "oklch(0.92 0.05 60)" }}>
              왼쪽<br />딸기요거롤
            </div>
            <div className="rounded-lg py-5" style={{ background: "oklch(0.16 0.04 275 / 0.85)", border: "1px dashed oklch(0.78 0.14 55 / 0.55)", color: "oklch(0.90 0.05 60)" }}>
              컨베이어 자리
            </div>
            <div className="rounded-lg py-4" style={{ background: "oklch(0.24 0.07 85 / 0.75)", color: "oklch(0.92 0.05 60)" }}>
              오른쪽<br />반지
            </div>
          </div>
          <button className="btn-star" onClick={onComplete}>
            틀 확인 완료
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

