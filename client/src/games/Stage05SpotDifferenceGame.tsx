/*
 * Stage 5 - Aquarium: Spot the Difference
 * 오른쪽 수정본 이미지를 클릭해서 3단계의 틀린 부분을 찾는다.
 */
import { useMemo, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";
import { GameStartOverlay, GameClearOverlay } from "@/components/GameOverlays";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

interface Difference {
  id: string;
  x: number;
  y: number;
  radius?: number;
  label: string;
}

interface SpotStep {
  title: string;
  original: string;
  modified: string;
  answers: Difference[];
}

const BASE_WIDTH = 1086;
const BASE_HEIGHT = 1448;
const HIT_RADIUS = 72;

const STEPS: SpotStep[] = [
  {
    title: "Memory 1",
    original: "/webdev-static-assets/stage5-step1-1.png",
    modified: "/webdev-static-assets/stage5-step1-2.png",
    answers: [
      { id: "hat-crest", x: 842, y: 370, radius: 125, label: "Penguin hat crest color" },
      { id: "yellow-leaf", x: 386, y: 355, radius: 240, label: "Drooping yellow leaf" },
      { id: "chick-logo", x: 452, y: 630, radius: 75, label: "Chick logo" },
      { id: "watch-band", x: 649, y: 854, radius: 75, label: "Watch band color" },
      { id: "mushroom", x: 881, y: 1259, radius: 135, label: "Red mushroom" },
    ],
  },
  {
    title: "Memory 2",
    original: "/webdev-static-assets/stage5-step2-1.png",
    modified: "/webdev-static-assets/stage5-step2-2.png",
    answers: [
      { id: "fish-shape", x: 265, y: 347, radius: 62, label: "Small swimming fish shape" },
      { id: "starfish", x: 95, y: 391, radius: 68, label: "Starfish" },
      { id: "shirt-color", x: 995, y: 750, radius: 70, label: "Standing man's shirt color" },
      { id: "seashell", x: 221, y: 1146, radius: 64, label: "Seashell" },
      { id: "watch-band", x: 790, y: 1308, radius: 64, label: "Watch band color" },
    ],
  },
  {
    title: "Memory 3",
    original: "/webdev-static-assets/stage5-step3-1.png",
    modified: "/webdev-static-assets/stage5-step3-2.png",
    answers: [
      { id: "headband-starfish", x: 586, y: 364, radius: 120, label: "Headband starfish color" },
      { id: "blue-dolphin", x: 920, y: 575, radius: 120, label: "Blue dolphin plush" },
      { id: "axolotl-card", x: 927, y: 819, radius: 150, label: "Axolotl postcard" },
      { id: "pink-penguin", x: 52, y: 1008, radius: 250, label: "Pink penguin keychain" },
      { id: "platform-text", x: 151, y: 1408, radius: 300, label: "Platform text" },
    ],
  },
];

function markerPosition(answer: Difference) {
  return {
    left: `${(answer.x / BASE_WIDTH) * 100}%`,
    top: `${(answer.y / BASE_HEIGHT) * 100}%`,
  };
}

function HeartMarker({ answer }: { answer: Difference }) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...markerPosition(answer),
        transform: "translate(-50%, -50%)",
        width: "clamp(28px, 4vw, 46px)",
        height: "clamp(28px, 4vw, 46px)",
        borderRadius: "50%",
        background: "oklch(0.58 0.24 25 / 0.30)",
        border: "2px solid oklch(0.62 0.24 25 / 0.85)",
        boxShadow: "0 0 18px oklch(0.62 0.24 25 / 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "oklch(0.60 0.24 25 / 0.92)",
        fontSize: "clamp(20px, 3vw, 34px)",
        zIndex: 5,
      }}
    >
      ♥
    </div>
  );
}

function ImagePanel({
  title,
  src,
  foundAnswers,
  onClick,
}: {
  title: string;
  src: string;
  foundAnswers: Difference[];
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <section className="min-w-0">
      <div
        className="mb-2 text-center text-xs font-bold tracking-wide"
        style={{ color: "oklch(0.80 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
      >
        {title}
      </div>
      <div
        className="relative mx-auto overflow-hidden rounded-xl"
        style={{
          width: "100%",
          maxWidth: "min(43vw, 430px, 52vh)",
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
          background: "oklch(0.08 0.03 285)",
          border: "2px solid oklch(0.78 0.14 55 / 0.35)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
          cursor: onClick ? "crosshair" : "default",
          touchAction: "manipulation",
        }}
        onClick={onClick}
      >
        <img
          src={src}
          alt={title}
          draggable={false}
          className="block w-full h-full select-none"
          style={{ objectFit: "fill" }}
        />
        {foundAnswers.map((answer) => (
          <HeartMarker key={answer.id} answer={answer} />
        ))}
      </div>
    </section>
  );
}

export default function Stage05SpotDifferenceGame({ stage, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [showNextPopup, setShowNextPopup] = useState(false);
  const [miss, setMiss] = useState<{ x: number; y: number } | null>(null);

  const step = STEPS[stepIndex];
  const foundAnswers = useMemo(
    () => step.answers.filter((answer) => foundIds.includes(answer.id)),
    [foundIds, step]
  );
  const foundCount = foundIds.length;

  const handleModifiedClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (showNextPopup) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * BASE_WIDTH;
    const clickY = ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT;

    const answer = step.answers.find((candidate) => {
      if (foundIds.includes(candidate.id)) return false;
      return Math.hypot(candidate.x - clickX, candidate.y - clickY) <= (candidate.radius ?? HIT_RADIUS);
    });

    if (!answer) {
      setMiss({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      window.setTimeout(() => setMiss(null), 450);
      return;
    }


    const nextFoundIds = [...foundIds, answer.id];
    setFoundIds(nextFoundIds);

    if (nextFoundIds.length === step.answers.length) {
      window.setTimeout(() => {
        if (stepIndex === STEPS.length - 1) {
          onComplete();
        } else {
          setShowNextPopup(true);
        }
      }, 350);
    }
  };

  const goNextStep = () => {
    setStepIndex((index) => index + 1);
    setFoundIds([]);
    setShowNextPopup(false);
    setMiss(null);
  };

  const resetStage = () => {
    setStepIndex(0);
    setFoundIds([]);
    setShowNextPopup(false);
    setMiss(null);
    setStarted(false);
  };

  return (
    <GameLayout
      stage={stage}
      score={foundCount}
      maxScore={step.answers.length}
      hintText="오른쪽 그림에서 달라진 부분을 눌러줘. 좌표가 조금 애매하면 주변을 천천히 눌러봐!"
      onRetry={resetStage}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <GameStartOverlay
            title="Stage 5: Aquarium"
            description={<>Find the differences!<br />오른쪽 그림에서 다른 부분 5개를 찾아줘.</>}
            icon="🐠"
            onStart={() => setStarted(true)}
            buttonText="시작!"
          />
        ) : (
          <div className="w-full max-w-6xl">
            <header className="mb-3 text-center">
              <h2 className="text-lg font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                Stage 5: Aquarium
              </h2>
              <p className="text-xs mt-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                Find the differences! · {step.title} · {foundCount} / {step.answers.length}
              </p>
            </header>

            <div
              className="grid gap-3 items-start"
              style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              <ImagePanel title="Original" src={step.original} foundAnswers={foundAnswers} />
              <div className="relative">
                <ImagePanel title="Modified" src={step.modified} foundAnswers={foundAnswers} onClick={handleModifiedClick} />
                {miss && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: miss.x,
                      top: miss.y + 22,
                      transform: "translate(-50%, -50%)",
                      color: "oklch(0.70 0.22 25)",
                      fontSize: 12,
                      fontWeight: 700,
                      textShadow: "0 1px 6px rgba(0,0,0,0.55)",
                    }}
                  >
                    다시 찾아봐!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showNextPopup && (
          <GameClearOverlay
            title="Shall we move to the next memory?"
            description="진성 눈썰미가 좋은걸?!"
            icon="💙"
            onNext={goNextStep}
            buttonText="Next"
          />
        )}
      </div>
    </GameLayout>
  );
}
