/*
 * Stage 7 - 칠갑산: 가위바위보 계단 오르기 게임 틀
 * TODO: 가위바위보 결과에 따라 계단을 오르거나 내려가는 실제 라운드 로직을 구현한다.
 */
import { useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const CHOICES = ["가위", "바위", "보"];

export default function Stage07RockPaperScissorsStairsGame({ stage, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <GameLayout
      stage={stage}
      score={selected ? 1 : 0}
      maxScore={1}
      hintText="가위바위보에서 이기면 계단을 올라가는 게임으로 구현할 예정이에요."
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
        <div className="card-glow p-6 text-center max-w-md w-full">
          <div className="text-5xl mb-3">✊</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            Stage 7: 가위바위보 계단
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.90 0.05 60)" }}>
            칠갑산 정상까지 가위바위보로 한 칸씩 올라가는 자리입니다.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {CHOICES.map((choice) => (
              <button key={choice} className="btn-star" onClick={() => setSelected(choice)}>
                {choice}
              </button>
            ))}
          </div>
          <div className="h-24 flex items-end justify-center gap-2 mb-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 42,
                  height: 18 + i * 14,
                  borderRadius: "6px 6px 0 0",
                  background: i === 2 ? "oklch(0.78 0.14 55)" : "oklch(0.28 0.06 275)",
                  border: "1px solid oklch(0.78 0.14 55 / 0.35)",
                }}
              />
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
