/*
 * Stage 3 - 에버랜드: MZ 감성의 세련된 피하기 게임
 * 
 * 디자인: 핀터레스트 × 인스타그램 스토리 감성
 *   - 플레이어: 부드러운 그라디언트 원형 캐릭터
 *   - 장애물: 각 타입별로 고정된 이모지 (정신없이 바뀌지 않음)
 *   - 애니메이션: 자연스럽고 부드러운 낙하 + 미세한 회전
 *   - 배경: 트렌디한 파스텔 톤 + 미니멀한 장식
 *   - 피드백: 감성적이고 세련된 메시지
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
  icon: string; // 고정된 이모지
}

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const SURVIVE_SECONDS = 20;
const PLAYER_SIZE = 9;
const ITEM_SIZE = 8;
const PLAYER_SPEED = 2.4;

// 각 타입별로 고정된 장애물 (정신없이 바뀌지 않음)
const WORK_ITEMS = ["📱", "💬", "📧", "💻"];
const RIDE_ITEMS = ["🎢", "🎡", "🎠", "🎪"];

// MZ 감성 파스텔 팔레트 (트렌디한 톤)
const EV = {
  sky: "#f5f0ff",      // 연한 라벤더
  skyD: "#e8d5ff",     // 라벤더
  grass: "#e8f5f0",    // 연한 민트
  grassD: "#c8e6e1",   // 민트
  accent1: "#ffd6e8",  // 핑크
  accent2: "#d6f0ff",  // 라이트 블루
  accent3: "#fff0d6",  // 피치
  work: "#ffe8e8",     // 연한 빨강
  workD: "#ff6b6b",    // 빨강
  ride: "#e8f0ff",     // 연한 파랑
  rideD: "#4a90e2",    // 파랑
  player: "#fff0e8",   // 연한 베이지
  playerD: "#ffb366",  // 따뜻한 베이지
  white: "#ffffff",
  shadow: "rgba(0, 0, 0, 0.08)",
};

export default function Stage03EverlandDodgeGame({ stage, onComplete }: Props) {
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
    const isWork = Math.random() < 0.5;
    const items = isWork ? WORK_ITEMS : RIDE_ITEMS;
    const icon = items[Math.floor(Math.random() * items.length)];
    
    return {
      id: idRef.current++,
      x: 15 + Math.random() * 70,  // 더 넓은 범위에서 스폰
      y: -8,
      type: isWork ? "work" : "ride",
      speed: 0.35 + Math.random() * 0.25,  // 더 일정한 속도
      drift: -0.08 + Math.random() * 0.16,  // 미세한 좌우 흔들림
      rotation: 0,
      icon,
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

      // 더 천천히 스폰 (정신없이 떨어지지 않게)
      if (frameRef.current % 32 === 0) {
        setItems((prev) => [...prev, spawnItem()]);
      }

      setItems((prev) => {
        let escaped = 0;
        const nextItems = prev
          .map((item) => ({
            ...item,
            x: Math.max(4, Math.min(96, item.x + item.drift)),
            y: item.y + item.speed,
            rotation: item.rotation + 1.5,  // 미세한 회전
          }))
          .filter((item) => {
            const keep = item.y < 108;
            if (!keep) {
              escaped++;
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
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ev-gentle-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0.8; transform: translateY(2px) rotate(2deg); }
        }
        @keyframes ev-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .ev-deco { animation: ev-float 4s ease-in-out infinite; }
        .ev-item { animation: ev-gentle-fall 0.3s ease-out forwards; }
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
                boxShadow: `0 8px 24px ${EV.shadow}`,
              }}
            >
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: EV.rideD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                에버랜드 생존 미션 ✨
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
                style={{ 
                  background: `linear-gradient(135deg, ${EV.ride}, ${EV.accent2})`,
                  color: "#1a4d7a",
                  boxShadow: `0 4px 12px ${EV.rideD}44`,
                }}
              >
                도망치기 시작! 🏃
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md mb-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: EV.rideD }}>
                <span>✨ 생존 진행</span>
                <span>{SURVIVE_SECONDS - timeLeft} / {SURVIVE_SECONDS}초</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: `${EV.skyD}44`, boxShadow: `inset 0 2px 4px ${EV.shadow}` }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${EV.rideD}, ${EV.accent2})`,
                    boxShadow: `0 0 8px ${EV.rideD}66`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-5 mb-2 text-xs" style={{ color: EV.rideD }}>
              <span>피한 것: {dodged}개 💕</span>
              <span>이동: WASD / ← ↑ ↓ →</span>
            </div>

            <div
              className="relative w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                height: "330px",
                background: `linear-gradient(180deg, ${EV.sky} 0%, ${EV.grass} 100%)`,
                border: `2px solid ${EV.rideD}`,
                boxShadow: `0 12px 32px ${EV.shadow}, inset 0 0 32px ${EV.rideD}11`,
                touchAction: "none",
              }}
            >
              {/* 배경 장식 - 미니멀하고 세련됨 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* 큰 꽃 - 배경 */}
                <div
                  className="absolute ev-deco"
                  style={{
                    top: "10%",
                    right: "5%",
                    fontSize: "3rem",
                    opacity: 0.15,
                  }}
                >
                  🌸
                </div>
                {/* 중간 꽃 */}
                <div
                  className="absolute ev-deco"
                  style={{
                    bottom: "15%",
                    left: "8%",
                    fontSize: "2rem",
                    opacity: 0.12,
                    animationDelay: "0.8s",
                  }}
                >
                  🌼
                </div>
                {/* 작은 별 */}
                <div
                  className="absolute ev-deco"
                  style={{
                    top: "20%",
                    left: "15%",
                    fontSize: "1.2rem",
                    opacity: 0.2,
                    animationDelay: "1.2s",
                  }}
                >
                  ✨
                </div>
              </div>

              {/* 떨어지는 아이템들 - 자연스럽고 부드러운 애니메이션 */}
              {items.map((item) => {
                const bgColor = item.type === "work" ? EV.work : EV.ride;
                const borderColor = item.type === "work" ? EV.workD : EV.rideD;
                
                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                      zIndex: 10,
                      transition: "transform 0.1s ease-out",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        background: bgColor,
                        borderRadius: "50%",
                        border: `2px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem",
                        boxShadow: `0 4px 12px ${borderColor}44, inset 0 2px 4px rgba(255,255,255,0.6)`,
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      {item.icon}
                    </div>
                  </div>
                );
              })}

              {/* 플레이어 - 부드러운 그라디언트 */}
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
                  background: `linear-gradient(135deg, ${EV.player} 0%, ${EV.playerD} 100%)`,
                  border: `2px solid ${EV.playerD}`,
                  boxShadow: `0 6px 16px ${EV.playerD}44, inset 0 2px 4px ${EV.white}66`,
                  zIndex: 20,
                  overflow: "hidden",
                  transition: "box-shadow 0.2s ease-out",
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
                style={{ background: `linear-gradient(135deg, ${EV.ride}, ${EV.accent2})`, color: "#1a4d7a" }}
              >
                ↑
              </button>
              <div />
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("left", true)}
                onPointerUp={() => holdDirection("left", false)}
                onPointerLeave={() => holdDirection("left", false)}
                style={{ background: `linear-gradient(135deg, ${EV.ride}, ${EV.accent2})`, color: "#1a4d7a" }}
              >
                ←
              </button>
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("down", true)}
                onPointerUp={() => holdDirection("down", false)}
                onPointerLeave={() => holdDirection("down", false)}
                style={{ background: `linear-gradient(135deg, ${EV.ride}, ${EV.accent2})`, color: "#1a4d7a" }}
              >
                ↓
              </button>
              <button 
                className="btn-star py-2"
                onPointerDown={() => holdDirection("right", true)}
                onPointerUp={() => holdDirection("right", false)}
                onPointerLeave={() => holdDirection("right", false)}
                style={{ background: `linear-gradient(135deg, ${EV.ride}, ${EV.accent2})`, color: "#1a4d7a" }}
              >
                →
              </button>
            </div>
          </>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 animate-fade-in backdrop-blur-sm">
            <div 
              className="card-glow p-8 text-center animate-bounce-in max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${EV.sky} 0%, ${EV.skyD} 100%)`,
                border: `2px solid ${EV.rideD}`,
                boxShadow: `0 12px 32px ${EV.shadow}`,
              }}
            >
              <div className="text-5xl mb-3">🎢✨</div>
              <h2 
                className="text-xl font-bold"
                style={{ color: EV.rideD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                20초 생존 성공! 🎉
              </h2>
              <p className="text-sm mt-3" style={{ color: EV.rideD }}>
                회사 연락도, 놀이기구의 유혹도<br />
                무사히 피했어! 정말 멋있어 💕<br />
                다음 추억으로 가보자 🌸
              </p>
            </div>
          </div>
        )}

        {failed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 animate-fade-in backdrop-blur-sm">
            <div 
              className="card-glow p-8 text-center animate-bounce-in max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${EV.work} 0%, ${EV.accent1} 100%)`,
                border: `2px solid ${EV.workD}`,
                boxShadow: `0 12px 32px ${EV.shadow}`,
              }}
            >
              <div className="text-5xl mb-3">💥</div>
              <h2 
                className="text-xl font-bold"
                style={{ color: EV.workD, fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                어라, 닿았어! 😅
              </h2>
              <p className="text-sm mt-3" style={{ color: EV.workD }}>
                회사 연락이나 놀이기구에 닿았어요.<br />
                다시 한 번 도전해볼까? 화이팅! 💪
              </p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
