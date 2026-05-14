/*
 * Stage 10 - 벚꽃스냅: 같은 사진 위치 맞추기 게임 틀
 * TODO: 스냅 사진 카드들을 뒤집어 같은 사진 위치를 맞추는 메모리 게임을 구현한다.
 */
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function Stage10SamePhotoMatchGame({ stage, onComplete }: Props) {
  return (
    <GameLayout
      stage={stage}
      score={0}
      maxScore={6}
      hintText="같은 벚꽃스냅 사진 두 장의 위치를 맞추는 카드 매칭 게임 자리입니다."
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="card-glow p-6 text-center max-w-md w-full">
          <div className="text-5xl mb-3">🌸</div>
          <h2 className="text-xl font-bold mb-4" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            Stage 10: 같은 사진 위치 맞추기
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md flex items-center justify-center text-xl"
                style={{
                  background: "oklch(0.18 0.05 275 / 0.86)",
                  border: "1px solid oklch(0.78 0.14 55 / 0.38)",
                  color: "oklch(0.78 0.14 55)",
                }}
              >
                ?
              </div>
            ))}
          </div>
          <button className="btn-star" onClick={onComplete}>
            틀 확인 완료
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

