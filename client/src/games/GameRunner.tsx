/*
 * Stage 3 - 에버랜드: 떨어지는 이모지 피하기
 * WASD 또는 화살표로 이동해서 회사 연락과 놀이공원 유혹을 20초 동안 피한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  drift: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const SURVIVE_SECONDS = 20;
const PLAYER_SIZE = 9;
const ITEM_SIZE = 8;
const PLAYER_SPEED = 2.4;
const HAZARDS = ["📱", "📞", "💬", "📧", "💻", "📊", "🎢", "🍦", "🎠", "🎡"];

export default function GameRunner({ stage, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [player, setPlayer] = useState({ x: 50, y: 82 });
  const [timeLeft, setTimeLeft] = useState(SURVIVE_SECONDS);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dodged, setDodged] = useState(0);
  const idRef = useRef(0);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const keysRef = useRef(new Set<string>());
  const playerRef = useRef(player);
  const completedRef = useRef(false);
  const failedRef = useRef(false);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const spawnItem = useCallback((): FallingItem => {
    return {
      id: idRef.current++,
      x: 8 + Math.random() * 84,
      y: -8,
      emoji: HAZARDS[Math.floor(Math.random() * HAZARDS.length)],
      speed: 0.45 + Math.random() * 0.45,
      drift: -0.12 + Math.random() * 0.24,
    };
  }, []);

  const resetGame = () => {
    keysRef.current.clear();
    completedRef.current = false;
    failedRef.current = false;
    setStarted(false);
    setItems([]);
    setPlayer({ x: 50, y: 82 });
    setTimeLeft(SURVIVE_SECONDS);
    setCompleted(false);
    setFailed(false);
    setDodged(0);
    frameRef.current = 0;
  };

  const failGame = useCallback(() => {
    if (completedRef.current || failedRef.current) return;
    failedRef.current = true;
    setFailed(true);
    keysRef.current.clear();
  }, []);

  const completeGame = useCallback(() => {
    if (completedRef.current || failedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    keysRef.current.clear();
    setTimeout(onComplete, 2200);
  }, [onComplete]);

  useEffect(() => {
    if (!started || completed || failed) return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer);
          completeGame();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, failed, completeGame]);

  useEffect(() => {
    if (!started || completed || failed) return;

    const normalizeKey = (key: string) => key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        keysRef.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => {
      keysRef.current.delete(normalizeKey(event.key));
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [started, completed, failed]);

  useEffect(() => {
    if (!started || completed || failed) return;

    const loop = () => {
      frameRef.current++;

      setPlayer((current) => {
        const keys = keysRef.current;
        const dx = (keys.has("arrowright") || keys.has("d") ? PLAYER_SPEED : 0) - (keys.has("arrowleft") || keys.has("a") ? PLAYER_SPEED : 0);
        const dy = (keys.has("arrowdown") || keys.has("s") ? PLAYER_SPEED : 0) - (keys.has("arrowup") || keys.has("w") ? PLAYER_SPEED : 0);
        const next = {
          x: Math.max(PLAYER_SIZE / 2, Math.min(100 - PLAYER_SIZE / 2, current.x + dx)),
          y: Math.max(PLAYER_SIZE / 2, Math.min(100 - PLAYER_SIZE / 2, current.y + dy)),
        };
        playerRef.current = next;
        return next;
      });

      if (frameRef.current % 24 === 0) {
        setItems((prev) => [...prev, spawnItem()]);
      }

      setItems((prev) => {
        let escaped = 0;
        const nextItems = prev
          .map((item) => ({
            ...item,
            x: Math.max(4, Math.min(96, item.x + item.drift)),
            y: item.y + item.speed,
          }))
          .filter((item) => {
            const keep = item.y < 108;
            if (!keep) escaped++;
            return keep;
          });

        const hit = nextItems.some((item) => {
          const dx = item.x - playerRef.current.x;
          const dy = item.y - playerRef.current.y;
          return Math.hypot(dx, dy) < (PLAYER_SIZE + ITEM_SIZE) * 0.45;
        });

        if (escaped > 0) {
          setDodged((count) => count + escaped);
        }
        if (hit) {
          failGame();
        }

        return nextItems;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, completed, failed, spawnItem, failGame]);

  const holdDirection = (direction: "up" | "down" | "left" | "right", pressed: boolean) => {
    const keyByDirection = {
      up: "arrowup",
      down: "arrowdown",
      left: "arrowleft",
      right: "arrowright",
    };
    if (pressed) keysRef.current.add(keyByDirection[direction]);
    else keysRef.current.delete(keyByDirection[direction]);
  };

  const progress = ((SURVIVE_SECONDS - timeLeft) / SURVIVE_SECONDS) * 100;

  return (
    <GameLayout
      stage={stage}
      score={dodged}
      timeLeft={started && !completed && !failed ? timeLeft : undefined}
      hintText="WASD 또는 화살표로 움직여서 떨어지는 이모지를 모두 피해! 20초만 버티면 클리어야."
      showBite={failed && !completed}
      onRetry={resetGame}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">🎢</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                에버랜드 생존 미션!
              </h2>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: "oklch(0.90 0.05 60)" }}>
회사로부터 도망치고 살아남아보자!<br />
 사실 피해야 할 건<br /> 회사 연락만이 아닐지도..?<br />
                WASD 또는 화살표로 20초 동안 살아남아봐.
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>도망치기 시작!</button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: "oklch(0.90 0.05 60)" }}>
                <span>🎢 생존 진행</span>
                <span>{SURVIVE_SECONDS - timeLeft} / {SURVIVE_SECONDS}초</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.05 275 / 0.8)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, oklch(0.72 0.12 350), oklch(0.78 0.14 55))",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-5 mb-2 text-xs" style={{ color: "oklch(0.90 0.05 60)" }}>
              <span>피한 이모지: {dodged}</span>
              <span>이동: WASD / ← ↑ ↓ →</span>
            </div>

            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                height: "330px",
                background: "linear-gradient(180deg, oklch(0.14 0.06 275 / 0.82), oklch(0.10 0.04 285 / 0.86))",
                border: "2px solid oklch(1 0 0 / 20%)",
                boxShadow: "inset 0 0 28px rgba(0,0,0,0.28)",
                touchAction: "none",
              }}
            >
              <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs" style={{ color: "oklch(0.90 0.05 60 / 0.72)" }}>
                  떨어지는 이모지에 닿으면 실패!
                </span>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="absolute text-3xl pointer-events-none"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: "translate(-50%, -50%)",
                    filter: "drop-shadow(0 0 8px rgba(255,120,120,0.75))",
                    zIndex: 10,
                  }}
                >
                  {item.emoji}
                </div>
              ))}

              <div
                className="absolute"
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  width: `${PLAYER_SIZE}%`,
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "oklch(0.78 0.14 55 / 0.18)",
                  border: "2px solid oklch(0.78 0.14 55 / 0.75)",
                  boxShadow: "0 0 16px oklch(0.78 0.14 55 / 0.45)",
                  zIndex: 20,
                  overflow: "hidden",
                }}
              >
                {stage.caricature ? (
                  <img
                    src={stage.caricature}
                    alt="진성이"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "scale(1.18)",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "2rem", lineHeight: 1 }}>🏃</span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 w-40 sm:hidden">
              <div />
              <button className="btn-star py-2" onPointerDown={() => holdDirection("up", true)} onPointerUp={() => holdDirection("up", false)} onPointerLeave={() => holdDirection("up", false)}>↑</button>
              <div />
              <button className="btn-star py-2" onPointerDown={() => holdDirection("left", true)} onPointerUp={() => holdDirection("left", false)} onPointerLeave={() => holdDirection("left", false)}>←</button>
              <button className="btn-star py-2" onPointerDown={() => holdDirection("down", true)} onPointerUp={() => holdDirection("down", false)} onPointerLeave={() => holdDirection("down", false)}>↓</button>
              <button className="btn-star py-2" onPointerDown={() => holdDirection("right", true)} onPointerUp={() => holdDirection("right", false)} onPointerLeave={() => holdDirection("right", false)}>→</button>
            </div>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🎢✨</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                20초 생존 성공!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
                회사 연락도, 놀이기구도 무사히 피했다! 키키
                <br />
                다음 추억으로 가보자 💕
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
