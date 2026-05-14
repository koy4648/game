/*
 * Stage 9 - 대전 1주년: 딸기요거롤/반지 컨베이어 분류 게임
 * 위에서 아래로 계속 흐르는 아이템 중 가장 앞에 있는 것을 좌우 키로 분류한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type ItemType = "strawberryRoll" | "ring";
type Direction = "left" | "right";

interface ConveyorItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
}

interface Feedback {
  id: number;
  text: string;
  isGood: boolean;
}

const ITEM_EMOJI: Record<ItemType, string> = {
  strawberryRoll: "🍰",
  ring: "💍",
};

const ITEM_LABEL: Record<ItemType, string> = {
  strawberryRoll: "딸기요거롤",
  ring: "반지",
};

const TARGET_SCORE = 20;
const PENALTY = 5;
const SPAWN_INTERVAL_MS = 850;
const ITEM_SPEED_PER_SECOND = 24;

function createItem(id: number, y = -16): ConveyorItem {
  return {
    id,
    type: Math.random() > 0.5 ? "strawberryRoll" : "ring",
    x: 42 + Math.random() * 16,
    y,
  };
}

export default function Stage09SortBreadRingGame({ stage, onComplete }: Props) {
  const nextIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const feedbackIdRef = useRef(0);
  const itemsRef = useRef<ConveyorItem[]>([]);
  const [started, setStarted] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [items, setItems] = useState<ConveyorItem[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("벨트 위 아이템을 분류해줘!");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const progress = Math.min(100, Math.round((score / TARGET_SCORE) * 100));

  const addFeedback = useCallback((text: string, isGood: boolean) => {
    const id = feedbackIdRef.current++;
    setFeedbacks((current) => [...current, { id, text, isGood }]);
    window.setTimeout(() => {
      setFeedbacks((current) => current.filter((feedback) => feedback.id !== id));
    }, 760);
  }, []);

  const spawnItem = useCallback((y = -16) => {
    setItems((current) => {
      const nextItems = [...current, createItem(nextIdRef.current++, y)];
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const beginGame = () => {
    nextIdRef.current = 0;
    lastFrameTimeRef.current = null;
    const initialItems = [createItem(nextIdRef.current++, -6), createItem(nextIdRef.current++, -38)];
    setScore(0);
    itemsRef.current = initialItems;
    setItems(initialItems);
    setMessage("가장 아래쪽 아이템부터 분류해줘!");
    setWrongFlash(false);
    setFeedbacks([]);
    setCleared(false);
    setStarted(true);
  };

  const resetGame = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    nextIdRef.current = 0;
    lastFrameTimeRef.current = null;
    setStarted(false);
    setCleared(false);
    itemsRef.current = [];
    setItems([]);
    setScore(0);
    setMessage("벨트 위 아이템을 분류해줘!");
    setWrongFlash(false);
    setFeedbacks([]);
  };

  const handleSort = useCallback(
    (direction: Direction) => {
      if (!started || cleared) return;

      const currentItems = itemsRef.current;
      if (currentItems.length === 0) return;

      const foremostItem = currentItems.reduce((front, item) => (item.y > front.y ? item : front), currentItems[0]);
      const isCorrect =
        (foremostItem.type === "strawberryRoll" && direction === "left") ||
        (foremostItem.type === "ring" && direction === "right");
      const nextItems = currentItems.filter((item) => item.id !== foremostItem.id);

      itemsRef.current = nextItems;
      setItems(nextItems);

      if (isCorrect) {
        setScore((currentScore) => {
          const nextScore = Math.min(TARGET_SCORE, currentScore + 1);
          if (nextScore >= TARGET_SCORE) {
            window.setTimeout(() => setCleared(true), 260);
          }
          return nextScore;
        });
        setMessage(`${ITEM_LABEL[foremostItem.type]} 성공! +1점`);
        addFeedback("+1", true);
      } else {
        setScore((currentScore) => Math.max(0, currentScore - PENALTY));
        setMessage(`반대쪽이야! -${PENALTY}점`);
        addFeedback(`-${PENALTY}`, false);
        setWrongFlash(true);
        window.setTimeout(() => setWrongFlash(false), 280);
      }
    },
    [addFeedback, cleared, started]
  );

  useEffect(() => {
    if (!started || cleared) return;

    const tick = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }

      const delta = Math.min(64, time - lastFrameTimeRef.current);
      lastFrameTimeRef.current = time;

      setItems((current) => {
        const nextItems = current
          .map((item) => ({
            ...item,
            y: item.y + (ITEM_SPEED_PER_SECOND * delta) / 1000,
          }))
          .filter((item) => item.y < 112);
        itemsRef.current = nextItems;
        return nextItems;
      });

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const spawnTimer = window.setInterval(() => spawnItem(), SPAWN_INTERVAL_MS);
    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.clearInterval(spawnTimer);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
  }, [cleared, spawnItem, started]);

  useEffect(() => {
    if (!started || cleared) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleSort("left");
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        handleSort("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cleared, handleSort, started]);

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={TARGET_SCORE}
      hintText="딸기요거롤은 왼쪽, 반지는 오른쪽. 키를 누르면 가장 아래쪽 아이템부터 사라져요."
      onRetry={resetGame}
    >
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div className="card-glow p-7 text-center max-w-sm w-full">
            <div style={{ fontSize: "3.2rem", marginBottom: 10 }}>🍰💍</div>
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: "oklch(0.88 0.12 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
            >
              Stage 9: 성심당 컨베이어
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.88 0.04 60)" }}>
              위에서 내려오는 아이템을 계속 분류해줘.
              <br />
              딸기요거롤은 왼쪽, 반지는 오른쪽!
            </p>
            <button className="btn-star" onClick={beginGame} style={{ width: "100%" }}>
              시작하기
            </button>
          </div>
        </div>
      )}

      {started && !cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-5 w-full">
          <div
            className="w-full max-w-3xl"
            style={{
              transform: wrongFlash ? "translateX(-4px)" : "none",
              transition: "transform 90ms ease",
            }}
          >
            <div
              className="mb-3 text-center font-bold"
              style={{
                minHeight: 28,
                color: message.includes("-") ? "oklch(0.72 0.18 25)" : "oklch(0.83 0.13 70)",
                fontFamily: "'Gowun Dodum', sans-serif",
                textShadow: "0 2px 8px rgba(0,0,0,0.45)",
              }}
            >
              {message}
            </div>

            <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between text-sm font-bold" style={{ color: "oklch(0.9 0.05 75)" }}>
                <span>점수 {score} / {TARGET_SCORE}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, oklch(0.73 0.16 40), oklch(0.88 0.15 88))",
                    transition: "width 180ms ease",
                  }}
                />
              </div>
            </div>

            <div
              className="relative overflow-hidden"
              style={{
                height: "clamp(360px, 55vh, 560px)",
                borderRadius: 18,
                border: "2px solid oklch(0.78 0.14 55 / 0.42)",
                background: "linear-gradient(180deg, oklch(0.18 0.05 280), oklch(0.11 0.04 275))",
                boxShadow: "0 18px 44px rgba(0,0,0,0.36)",
              }}
            >
              <style>
                {`
                  @keyframes stage9-belt-flow {
                    from { background-position-y: 0; }
                    to { background-position-y: 72px; }
                  }
                `}
              </style>

              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  bottom: 0,
                  width: "min(52vw, 300px)",
                  transform: "translateX(-50%)",
                  background:
                    "repeating-linear-gradient(180deg, oklch(0.30 0.03 250) 0 34px, oklch(0.22 0.03 250) 34px 68px)",
                  borderLeft: "5px solid oklch(0.48 0.04 250)",
                  borderRight: "5px solid oklch(0.12 0.03 250)",
                  boxShadow: "inset 14px 0 18px rgba(255,255,255,0.05), inset -14px 0 18px rgba(0,0,0,0.25)",
                  animation: "stage9-belt-flow 0.8s linear infinite",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 18,
                  width: "clamp(78px, 18vw, 120px)",
                  height: "clamp(80px, 17vh, 132px)",
                  borderRadius: 16,
                  border: "2px dashed oklch(0.72 0.18 140 / 0.66)",
                  background: "oklch(0.17 0.07 140 / 0.46)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.84 0.12 140)",
                  fontSize: "0.78rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center",
                }}
              >
                A / ←<br />🍰
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: 18,
                  width: "clamp(78px, 18vw, 120px)",
                  height: "clamp(80px, 17vh, 132px)",
                  borderRadius: 16,
                  border: "2px dashed oklch(0.88 0.13 80 / 0.66)",
                  background: "oklch(0.20 0.08 80 / 0.42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.92 0.12 80)",
                  fontSize: "0.78rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center",
                }}
              >
                D / →<br />💍
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: "clamp(58px, 12vw, 92px)",
                    aspectRatio: "1 / 1",
                    transform: "translate(-50%, -50%)",
                    borderRadius: 20,
                    background: "oklch(0.96 0.03 85)",
                    border: "3px solid oklch(0.78 0.14 55)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(2.1rem, 7vw, 3.7rem)",
                    transition: "filter 120ms ease",
                    zIndex: Math.round(item.y),
                  }}
                  aria-label={ITEM_LABEL[item.type]}
                >
                  {ITEM_EMOJI[item.type]}
                </div>
              ))}

              {feedbacks.map((feedback, index) => (
                <div
                  key={feedback.id}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: `${18 + index * 10}%`,
                    transform: "translateX(-50%)",
                    color: feedback.isGood ? "oklch(0.88 0.14 130)" : "oklch(0.74 0.18 25)",
                    fontSize: "clamp(1.4rem, 5vw, 2.4rem)",
                    fontWeight: 900,
                    textShadow: "0 4px 14px rgba(0,0,0,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  {feedback.text}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                className="btn-star"
                onClick={() => handleSort("left")}
                style={{
                  borderColor: "oklch(0.72 0.18 140 / 0.75)",
                }}
              >
                ← 딸기요거롤
              </button>
              <button
                className="btn-star"
                onClick={() => handleSort("right")}
                style={{
                  borderColor: "oklch(0.88 0.13 80 / 0.75)",
                }}
              >
                반지 →
              </button>
            </div>
          </div>
        </div>
      )}

      {cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div className="card-glow p-8 text-center max-w-sm w-full animate-bounce-in">
            <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>💍🍰</div>
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: "oklch(0.88 0.12 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
            >
              1주년 데이트 완료!
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.88 0.04 60)" }}>
              반지도 만들고 딸기요거롤도 챙겼다.
            </p>
            <button className="btn-star" onClick={onComplete} style={{ width: "100%" }}>
              다음 기억으로 →
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
