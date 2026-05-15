/*
 * Stage 3 - 에버랜드: 정성스러운 캐릭터 피하기 게임
 * 
 * 디자인: 손그려진 감성 × 놀이공원 테마
 *   - 플레이어: 귀여운 도트 스타일 캐릭터 (손그림 느낌)
 *   - 장애물: 회사 연락(📱💬), 놀이기구(🎢🎡🎠) → 정성스러운 일러스트 느낌
 *   - 배경: 파스텔 놀이공원 그라디언트
 *   - 피드백: 따뜻한 메시지와 함께 정성스러운 이모지
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: "work" | "ride";
  speed: number;
  drift: number;
  rotation: number;
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const SURVIVE_SECONDS = 20;
const PLAYER_SIZE = 9;
const ITEM_SIZE = 8;
const PLAYER_SPEED = 2.4;

// 정성스러운 장애물 타입
const HAZARDS = [
  { type: "work", icon: "📱", label: "전화" },
  { type: "work", icon: "💬", label: "메시지" },
  { type: "work", icon: "📧", label: "이메일" },
  { type: "work", icon: "💻", label: "노트북" },
  { type: "ride", icon: "🎢", label: "롤러코스터" },
  { type: "ride", icon: "🎡", label: "관람차" },
  { type: "ride", icon: "🎠", label: "회전목마" },
  { type: "ride", icon: "🎪", label: "텐트" },
] as const;

// 에버랜드 파스텔 팔레트
const EV = {
  sky: "#e8f4ff",
  skyD: "#b8d8ff",
  grass: "#c8f0a8",
  grassD: "#a8d878",
  flower1: "#ffb3d9",
  flower2: "#ffd9b3",
  flower3: "#b3e5ff",
  work: "#ffb3b3",
  workD: "#e86868",
  ride: "#b3d9ff",
  rideD: "#5a9cff",
  player: "#ffe8b3",
  playerD: "#ffb366",
  white: "#ffffff",
};

export default function Stage03EverlandDodgeGame({ stage, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [player, setPlayer] = useState({ x: 50, y: 82 });
  const [timeLeft, setTimeLeft] = useState(SURVIVE_SECONDS);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dodged, setDodged] = useState(0);
  const [workCount, setWorkCount] = useState(0);
  const [rideCount, setRideCount] = useState(0);
  
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
    const hazard = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
    return {
      id: idRef.current++,
      x: 8 + Math.random() * 84,
      y: -8,
      type: hazard.type,
      speed: 0.45 + Math.random() * 0.45,
      drift: -0.12 + Math.random() * 0.24,
      rotation: Math.random() * 360,
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
    setWorkCount(0);
    setRideCount(0);
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
            rotation: item.rotation + 3,
          }))
          .filter((item) => {
            const keep = item.y < 108;
            if (!keep) {
              escaped++;
              if (item.type === "work") setWorkCount((c) => c + 1);
              else setRideCount((c) => c + 1);
            }
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
      hintText="WASD 또는 화살표로 움직여서 떨어지는 것들을 모두 피해! 20초만 버티면 클리어야."
      showBite={failed && !completed}
      onRetry={resetGame}
    >
      <style>{`
        @keyframes ev-float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes ev-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ev-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .ev-deco { animation: ev-float 3s ease-in-out infinite; }
        .ev-item { animation: ev-spin 2s linear infinite; }
      `}</style>

      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">🎢</div>
            <div 
              className="card-glow p-6 text-center max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${EV.sky} 0%, ${EV.skyD} 100%)`,
                border: `2px solid ${EV.rideD}`,
              }}
            >
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: EV.rideD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                에버랜드 생존 미션! 🎡
              </h2>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: EV.rideD }}>
                회사로부터 도망치고 살아남아보자!<br />
                사실 피해야 할 건<br />
                회사 연락만이 아닐지도..?<br />
                <br />
                WASD 또는 화살표로 20초 동안 살아남아봐.
              </p>
              <button 
                className="btn-star"
                onClick={() => setStarted(true)}
                style={{ background: EV.ride, color: "#1a4d7a" }}
              >
                도망치기 시작! 🏃
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: EV.rideD }}>
                <span>🎢 생존 진행</span>
                <span>{SURVIVE_SECONDS - timeLeft} / {SURVIVE_SECONDS}초</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: `${EV.skyD}66` }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${EV.ride}, ${EV.flower3})`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-5 mb-2 text-xs" style={{ color: EV.rideD }}>
              <span>피한 것: {dodged}개</span>
              <span>이동: WASD / ← ↑ ↓ →</span>
            </div>

            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                height: "330px",
                background: `linear-gradient(180deg, ${EV.sky} 0%, ${EV.grass}44 100%)`,
                border: `2px solid ${EV.rideD}`,
                boxShadow: `inset 0 0 28px ${EV.rideD}22`,
                touchAction: "none",
              }}
            >
              {/* 배경 장식 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* 꽃 */}
                <div
                  className="absolute ev-deco"
                  style={{
                    top: "15%",
                    left: "20%",
                    fontSize: "2rem",
                    opacity: 0.4,
                  }}
                >
                  🌸
                </div>
                <div
                  className="absolute ev-deco"
                  style={{
                    top: "25%",
                    right: "15%",
                    fontSize: "1.8rem",
                    opacity: 0.35,
                    animationDelay: "0.5s",
                  }}
                >
                  🌼
                </div>
                <div
                  className="absolute ev-deco"
                  style={{
                    top: "10%",
                    left: "60%",
                    fontSize: "1.5rem",
                    opacity: 0.3,
                    animationDelay: "1s",
                  }}
                >
                  🌺
                </div>
              </div>

              {/* 떨어지는 아이템들 */}
              {items.map((item) => {
                const hazard = HAZARDS.find(h => h.type === item.type && h.icon === item.type) || HAZARDS[0];
                const actualHazard = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
                const bgColor = item.type === "work" ? EV.work : EV.ride;
                const borderColor = item.type === "work" ? EV.workD : EV.rideD;
                
                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-none ev-item"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: bgColor,
                        borderRadius: "50%",
                        border: `2px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.3rem",
                        boxShadow: `0 0 12px ${borderColor}66, inset 0 2px 4px rgba(255,255,255,0.4)`,
                      }}
                    >
                      {HAZARDS[Math.floor(Math.random() * HAZARDS.length)].icon}
                    </div>
                  </div>
                );
              })}

              {/* 플레이어 */}
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
                  background: `linear-gradient(135deg, ${EV.player}, ${EV.playerD})`,
                  border: `2px solid ${EV.playerD}`,
                  boxShadow: `0 0 16px ${EV.playerD}66, inset 0 2px 4px ${EV.white}44`,
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
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>🏃</span>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 w-40 sm:hidden">
              <div />
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("up", true)}
                onPointerUp={() => holdDirection("up", false)}
                onPointerLeave={() => holdDirection("up", false)}
                style={{ background: EV.ride, color: "#1a4d7a" }}
              >
                ↑
              </button>
              <div />
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("left", true)}
                onPointerUp={() => holdDirection("left", false)}
                onPointerLeave={() => holdDirection("left", false)}
                style={{ background: EV.ride, color: "#1a4d7a" }}
              >
                ←
              </button>
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("down", true)}
                onPointerUp={() => holdDirection("down", false)}
                onPointerLeave={() => holdDirection("down", false)}
                style={{ background: EV.ride, color: "#1a4d7a" }}
              >
                ↓
              </button>
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("right", true)}
                onPointerUp={() => holdDirection("right", false)}
                onPointerLeave={() => holdDirection("right", false)}
                style={{ background: EV.ride, color: "#1a4d7a" }}
              >
                →
              </button>
            </div>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div 
              className="card-glow p-8 text-center animate-bounce-in max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${EV.sky} 0%, ${EV.skyD} 100%)`,
                border: `2px solid ${EV.rideD}`,
              }}
            >
              <div className="text-5xl mb-3">🎢✨</div>
              <h2 
                className="text-xl font-bold"
                style={{ color: EV.rideD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                20초 생존 성공! 🎉
              </h2>
              <p className="text-sm mt-2" style={{ color: EV.rideD }}>
                회사 연락도, 놀이기구의 유혹도<br />
                무사히 피했어! 키키 🌸<br />
                다음 추억으로 가보자 💕
              </p>
            </div>
          </div>
        )}

        {failed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div 
              className="card-glow p-8 text-center animate-bounce-in max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${EV.work} 0%, ${EV.workD}44 100%)`,
                border: `2px solid ${EV.workD}`,
              }}
            >
              <div className="text-5xl mb-3">💥</div>
              <h2 
                className="text-xl font-bold"
                style={{ color: EV.workD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                어라, 닿았어! 😅
              </h2>
              <p className="text-sm mt-2" style={{ color: EV.workD }}>
                회사 연락이나 놀이기구에 닿았어요.<br />
                다시 한 번 도전해볼까? 🎢
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
