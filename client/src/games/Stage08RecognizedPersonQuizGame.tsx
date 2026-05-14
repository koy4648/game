/*
 * Stage 8 - 그민페: "진성이를 알아본 사람은 누구?!" 이미지 퀴즈 게임 틀
 * TODO: 실제 이미지 에셋을 배치하고 정답 선택/오답 피드백/클리어 연출을 구현한다.
 */
import { useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const OPTIONS = ["정경", "서형", "가은", "현지"];

export default function Stage08RecognizedPersonQuizGame({ stage, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <GameLayout
      stage={stage}
      score={selected ? 1 : 0}
      maxScore={1}
      hintText="이미지 속 힌트를 보고 진성이를 알아본 사람이 누구인지 맞히는 퀴즈 자리입니다."
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="card-glow p-6 text-center max-w-lg w-full">
          <div className="text-5xl mb-3">🎵</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            Stage 8: 진성이를 알아본 사람은 누구?!
          </h2>
          <div
            className="my-5 rounded-lg flex items-center justify-center"
            style={{
              minHeight: 180,
              background: "oklch(0.16 0.04 275 / 0.86)",
              border: "1px dashed oklch(0.78 0.14 55 / 0.45)",
              color: "oklch(0.86 0.05 60)",
              fontFamily: "'Gowun Dodum', sans-serif",
            }}
          >
            이미지 퀴즈 영역
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {OPTIONS.map((option) => (
              <button key={option} className="btn-star" onClick={() => setSelected(option)}>
                {option}
              </button>
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
