/*
 * Stage 9 - 대전 1주년: 딸기요거롤/반지 컨베이어 분류 게임
 * 디자인 v3: 성심당 베이커리 × 파스텔 로맨틱
 *   - 아이템: 원형 접시 위 케이크 / 빛나는 보석함 스타일
 *   - 컨베이어: 따뜻한 우드 + 양쪽 롤러
 *   - 배경: 파스텔 그라디언트 + 물방울/하트 패턴
 *   - 분류함: 물결 모양 + 글로우 효과
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

const ITEM_LABEL: Record<ItemType, string> = {
  strawberryRoll: "딸기요거롤",
  ring: "반지",
};

const GOOD_FEEDBACKS = ["🍰 +1!", "✨ 완벽!", "💕 정답!", "🎀 굿!", "⭐ +1!", "🌸 +1!"];
const BAD_FEEDBACKS = ["💦 앗!", "😅 반대!", "🙈 아이쿠!", "💨 틀렸어!"];

const TARGET_SCORE = 20;
const PENALTY = 5;
const SPAWN_INTERVAL_MS = 400;
const ITEM_SPEED_PER_SECOND = 50;

function createItem(id: number, y = -16): ConveyorItem {
  return {
    id,
    type: Math.random() > 0.5 ? "strawberryRoll" : "ring",
    x: 42 + Math.random() * 16,
    y,
  };
}

const C = {
  cream: "#fff8f0",
  creamD: "#fdf0e0",
  pink: "#f48fb1",
  pinkL: "#fce4ec",
  pinkD: "#c2185b",
  pinkM: "#e91e63",
  gold: "#f9a825",
  goldL: "#fff9c4",
  goldD: "#e65100",
  goldM: "#ff8f00",
  brown: "#8d6e63",
  brownL: "#d7ccc8",
  brownD: "#4e342e",
  brownM: "#6d4c41",
  strawberry: "#e53935",
  white: "#ffffff",
  textD: "#4e342e",
  textL: "#a1887f",
  lavender: "#e1bee7",
  mint: "#b2dfdb",
};

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
    setFeedbacks((cur) => [...cur, { id, text, isGood }]);
    window.setTimeout(() => setFeedbacks((cur) => cur.filter((f) => f.id !== id)), 820);
  }, []);

  const spawnItem = useCallback((y = -16) => {
    setItems((cur) => {
      const next = [...cur, createItem(nextIdRef.current++, y)];
      itemsRef.current = next;
      return next;
    });
  }, []);

  const beginGame = () => {
    nextIdRef.current = 0;
    lastFrameTimeRef.current = null;
    const init = [createItem(nextIdRef.current++, -6), createItem(nextIdRef.current++, -38)];
    setScore(0);
    itemsRef.current = init;
    setItems(init);
    setMessage("🍰 딸기요거롤은 왼쪽, 💍 반지는 오른쪽!");
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
      const cur = itemsRef.current;
      if (cur.length === 0) return;
      const front = cur.reduce((a, b) => (b.y > a.y ? b : a), cur[0]);
      const isCorrect =
        (front.type === "strawberryRoll" && direction === "left") ||
        (front.type === "ring" && direction === "right");
      const next = cur.filter((i) => i.id !== front.id);
      itemsRef.current = next;
      setItems(next);
      if (isCorrect) {
        setScore((s) => {
          const ns = Math.min(TARGET_SCORE, s + 1);
          if (ns >= TARGET_SCORE) window.setTimeout(onComplete, 260);
          return ns;
        });
        setMessage(`${ITEM_LABEL[front.type]} 완벽해! 🎀`);
        addFeedback(GOOD_FEEDBACKS[Math.floor(Math.random() * GOOD_FEEDBACKS.length)], true);
      } else {
        setScore((s) => Math.max(0, s - PENALTY));
        setMessage(`반대쪽이야! -${PENALTY}점 💦`);
        addFeedback(BAD_FEEDBACKS[Math.floor(Math.random() * BAD_FEEDBACKS.length)], false);
        setWrongFlash(true);
        window.setTimeout(() => setWrongFlash(false), 300);
      }
    },
    [addFeedback, cleared, started]
  );

  useEffect(() => {
    if (!started || cleared) return;
    const tick = (time: number) => {
      if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = time;
      const delta = Math.min(64, time - lastFrameTimeRef.current);
      lastFrameTimeRef.current = time;
      setItems((cur) => {
        const next = cur
          .map((item) => ({ ...item, y: item.y + (ITEM_SPEED_PER_SECOND * delta) / 1000 }))
          .filter((item) => item.y < 112);
        itemsRef.current = next;
        return next;
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") { e.preventDefault(); handleSort("left"); }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") { e.preventDefault(); handleSort("right"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cleared, handleSort, started]);

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={TARGET_SCORE}
      hintText="🍰 딸기요거롤은 왼쪽 / 💍 반지는 오른쪽! 가장 아래쪽 아이템부터 분류해요"
      onRetry={resetGame}
    >
      <style>{`
        @keyframes s9-belt {
          from { background-position-y: 0; }
          to   { background-position-y: 56px; }
        }
        @keyframes s9-item-drop {
          0%   { transform: translate(-50%,-50%) scale(0.5) rotate(-12deg); opacity:0; filter: blur(4px); }
          60%  { transform: translate(-50%,-50%) scale(1.12) rotate(3deg);  opacity:1; filter: blur(0); }
          80%  { transform: translate(-50%,-50%) scale(0.96) rotate(-1deg); }
          100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg);  opacity:1; }
        }
        @keyframes s9-feedback-up {
          0%   { transform: translateX(-50%) translateY(0)    scale(1);    opacity:1; }
          100% { transform: translateX(-50%) translateY(-44px) scale(1.3); opacity:0; }
        }
        @keyframes s9-wrong-shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-7px) rotate(-1deg); }
          35%     { transform: translateX(7px)  rotate(1deg); }
          55%     { transform: translateX(-5px) rotate(-0.5deg); }
          75%     { transform: translateX(5px)  rotate(0.5deg); }
        }
        @keyframes s9-float {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%     { transform: translateY(-7px) rotate(3deg); }
        }
        @keyframes s9-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes s9-pulse-glow {
          0%,100% { box-shadow: 0 0 12px 2px var(--glow-color); }
          50%     { box-shadow: 0 0 24px 6px var(--glow-color); }
        }
        @keyframes s9-roller-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes s9-sparkle-pop {
          0%   { transform: translate(-50%,-50%) scale(0); opacity:1; }
          60%  { transform: translate(-50%,-50%) scale(1.4); opacity:1; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity:0; }
        }
        @keyframes s9-bounce-in {
          0%   { transform: scale(0.7); opacity:0; }
          65%  { transform: scale(1.06); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes s9-halo {
          0%,100% { transform: translate(-50%,-50%) scale(1);   opacity:0.5; }
          50%     { transform: translate(-50%,-50%) scale(1.15); opacity:0.2; }
        }
        .s9-item { animation: s9-item-drop 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .s9-feedback { animation: s9-feedback-up 0.82s ease-out forwards; }
        .s9-deco { animation: s9-float 3s ease-in-out infinite; }
        .s9-bounce-in { animation: s9-bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ── 시작 화면 ── */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            className="card-glow p-7 text-center max-w-sm w-full"
            style={{
              background: `linear-gradient(150deg, ${C.cream} 0%, ${C.pinkL} 55%, ${C.goldL} 100%)`,
              border: `2px solid ${C.pink}44`,
              borderRadius: 28,
              boxShadow: `0 12px 40px ${C.pink}22, 0 2px 0 ${C.white} inset`,
            }}
          >
            {/* 회전 장식 */}
            <div style={{ position: "relative", height: 64, marginBottom: 4 }}>
              {/* 중앙 큰 이모지 */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: "2.8rem", lineHeight: 1,
                filter: `drop-shadow(0 4px 12px ${C.pink}66)`,
              }}>🍰</div>
              {/* 주변 작은 이모지들 */}
              {[
                { e: "🍰", angle: 0 },
                { e: "💍", angle: 72 },
                { e: "🌸", angle: 144 },
                { e: "✨", angle: 216 },
                { e: "🎀", angle: 288 },
              ].map(({ e, angle }) => (
                <div key={angle} style={{
                  position: "absolute",
                  left: `calc(50% + ${Math.cos((angle - 90) * Math.PI / 180) * 26}px)`,
                  top: `calc(50% + ${Math.sin((angle - 90) * Math.PI / 180) * 26}px)`,
                  transform: "translate(-50%,-50%)",
                  fontSize: "1.1rem",
                  animation: `s9-float ${2.4 + angle / 200}s ease-in-out infinite`,
                  animationDelay: `${angle / 360}s`,
                }}>
                  {e}
                </div>
              ))}
            </div>

            <h2 style={{
              fontSize: "1.22rem", fontWeight: 800, marginBottom: 4,
              color: C.brownD, fontFamily: "'Gowun Dodum', sans-serif",
              letterSpacing: "-0.01em",
            }}>
              성심당 컨베이어 🍞
            </h2>
            <p style={{
              fontSize: "0.72rem", color: C.pink,
              fontFamily: "'Gowun Dodum', sans-serif",
              marginBottom: 16, fontWeight: 700,
            }}>
              대전 1주년 기념 데이트 ✨
            </p>

            {/* 분류 안내 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {/* 딸기요거롤 */}
              <div style={{
                flex: 1, padding: "12px 8px", borderRadius: 20,
                background: `linear-gradient(145deg, ${C.white}, ${C.pinkL})`,
                border: `2px solid ${C.pink}55`,
                boxShadow: `0 4px 16px ${C.pink}22`,
                fontFamily: "'Gowun Dodum', sans-serif",
              }}>
                {/* 원형 접시 미니 */}
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                  background: `radial-gradient(circle at 35% 35%, ${C.white}, ${C.pinkL})`,
                  border: `3px solid ${C.pink}66`,
                  boxShadow: `0 4px 12px ${C.pink}33, inset 0 2px 4px ${C.white}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem",
                }}>🍰</div>
                <div style={{ fontSize: "0.60rem", fontWeight: 800, color: C.pinkD, marginBottom: 2 }}>딸기요거롤</div>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${C.pink}, ${C.pinkM})`,
                  color: C.white, borderRadius: 999,
                  padding: "2px 10px", fontSize: "0.58rem", fontWeight: 700,
                }}>← 왼쪽</div>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", color: C.brownL, fontFamily: "'Gowun Dodum', sans-serif",
                flexShrink: 0,
              }}>VS</div>

              {/* 반지 */}
              <div style={{
                flex: 1, padding: "12px 8px", borderRadius: 20,
                background: `linear-gradient(145deg, ${C.white}, ${C.goldL})`,
                border: `2px solid ${C.gold}55`,
                boxShadow: `0 4px 16px ${C.gold}22`,
                fontFamily: "'Gowun Dodum', sans-serif",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                  background: `radial-gradient(circle at 35% 35%, ${C.white}, ${C.goldL})`,
                  border: `3px solid ${C.gold}66`,
                  boxShadow: `0 4px 12px ${C.gold}33, inset 0 2px 4px ${C.white}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem",
                }}>💍</div>
                <div style={{ fontSize: "0.60rem", fontWeight: 800, color: C.goldD, marginBottom: 2 }}>반지</div>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldM})`,
                  color: C.white, borderRadius: 999,
                  padding: "2px 10px", fontSize: "0.58rem", fontWeight: 700,
                }}>오른쪽 →</div>
              </div>
            </div>

            <p style={{
              fontSize: "0.76rem", lineHeight: 1.8, marginBottom: 20,
              color: C.textL, fontFamily: "'Gowun Dodum', sans-serif",
            }}>
              컨베이어에서 내려오는 아이템을<br />
              빠르게 분류해봐요! 🎀
            </p>
            <button
              className="btn-star"
              onClick={beginGame}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${C.pink} 0%, ${C.pinkM} 100%)`,
                borderRadius: 999,
                border: "none",
                padding: "0.9rem",
                fontSize: "0.95rem",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontWeight: 700,
                color: C.white,
                boxShadow: `0 6px 20px ${C.pink}55`,
                cursor: "pointer",
              }}
            >
              🍰 시작하기
            </button>
          </div>
        </div>
      )}

      {/* ── 게임 플레이 ── */}
      {started && !cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 w-full">
          <div
            className="w-full max-w-3xl"
            style={{ animation: wrongFlash ? "s9-wrong-shake 0.3s ease" : "none" }}
          >
            {/* 메시지 */}
            <div style={{
              minHeight: 28, marginBottom: 10, textAlign: "center",
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "0.90rem", fontWeight: 700,
              color: message.includes("-") || message.includes("반대") ? C.strawberry : C.brownD,
              textShadow: "0 1px 4px rgba(0,0,0,0.08)",
              transition: "color 0.2s",
            }}>
              {message}
            </div>

            {/* 프로그레스 */}
            <div style={{
              marginBottom: 12, borderRadius: 16,
              background: `linear-gradient(135deg, ${C.cream}, ${C.pinkL}88)`,
              border: `1.5px solid ${C.brownL}66`,
              padding: "7px 12px",
              boxShadow: `0 2px 10px ${C.pink}14`,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 5,
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.70rem", fontWeight: 700, color: C.brownD,
              }}>
                <span>🍰 {score} / {TARGET_SCORE}개 완료</span>
                <span style={{ color: C.pink }}>{progress}%</span>
              </div>
              <div style={{
                height: 9, borderRadius: 999,
                background: `${C.brownL}44`,
                overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
              }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${C.pink}, ${C.gold})`,
                  transition: "width 200ms ease",
                  position: "relative", overflow: "hidden",
                  boxShadow: `0 0 10px ${C.pink}88`,
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "repeating-linear-gradient(90deg,transparent 0 10px,rgba(255,255,255,0.3) 10px 14px)",
                  }} />
                </div>
              </div>
            </div>

            {/* ── 컨베이어 필드 ── */}
            <div
              style={{
                position: "relative",
                height: "clamp(330px, 50vh, 500px)",
                borderRadius: 24,
                overflow: "hidden",
                border: `2px solid ${C.brownL}88`,
                boxShadow: `0 16px 48px ${C.brown}22, 0 2px 0 ${C.white}cc inset`,
                // 따뜻한 파스텔 배경
                background: `
                  radial-gradient(ellipse at 15% 8%,  ${C.pinkL}cc   0%, transparent 42%),
                  radial-gradient(ellipse at 85% 10%, ${C.goldL}bb   0%, transparent 40%),
                  radial-gradient(ellipse at 50% 90%, ${C.lavender}66 0%, transparent 50%),
                  linear-gradient(180deg, #fff5f8 0%, ${C.cream} 50%, #fff8f0 100%)
                `,
              }}
            >
              {/* 배경 물방울 패턴 */}
              <svg
                aria-hidden
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="s9-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="12" cy="12" r="2.5" fill={C.pink} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#s9-dots)" />
              </svg>

              {/* 배경 장식 이모지 */}
              {[
                { e: "🥐", x: "7%", y: "7%", s: "1.7rem", d: "0s" },
                { e: "🍰", x: "83%", y: "5%", s: "1.5rem", d: "0.6s" },
                { e: "☕", x: "4%", y: "44%", s: "1.3rem", d: "1.1s" },
                { e: "🎂", x: "86%", y: "40%", s: "1.4rem", d: "0.9s" },
                { e: "🌸", x: "8%", y: "80%", s: "1.2rem", d: "0.4s" },
                { e: "✨", x: "82%", y: "77%", s: "1.1rem", d: "1.4s" },
              ].map((d, i) => (
                <div key={i} className="s9-deco" style={{
                  position: "absolute", left: d.x, top: d.y,
                  fontSize: d.s, opacity: 0.16,
                  pointerEvents: "none", userSelect: "none",
                  animationDelay: d.d,
                }}>{d.e}</div>
              ))}

              {/* 컨베이어 벨트 */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%", top: 0, bottom: 0,
                  width: "min(48vw, 260px)",
                  transform: "translateX(-50%)",
                  // 우드 그레인 패턴
                  background: `
                    repeating-linear-gradient(
                      180deg,
                      ${C.brownM}e0 0 24px,
                      ${C.brownD}e0 24px 28px,
                      ${C.brownM}e0 28px 52px,
                      ${C.brown}e0   52px 56px
                    )
                  `,
                  borderLeft: `5px solid ${C.brownD}`,
                  borderRight: `5px solid ${C.brownD}`,
                  boxShadow: `
                    inset 12px 0 20px rgba(255,255,255,0.07),
                    inset -12px 0 20px rgba(0,0,0,0.22),
                    6px 0 18px ${C.brown}33,
                    -6px 0 18px ${C.brown}33
                  `,
                  animation: "s9-belt 0.65s linear infinite",
                }}
              />

              {/* 벨트 중앙 광택 줄 */}
              <div aria-hidden style={{
                position: "absolute",
                left: "50%", top: 0, bottom: 0, width: 4,
                transform: "translateX(-50%)",
                background: `linear-gradient(180deg, transparent 0%, ${C.brownL}44 30%, ${C.brownL}44 70%, transparent 100%)`,
                pointerEvents: "none",
              }} />

              {/* 벨트 상단 롤러 */}
              <div aria-hidden style={{
                position: "absolute", top: -8, left: "50%",
                width: "min(52vw, 280px)",
                height: 16,
                transform: "translateX(-50%)",
                background: `linear-gradient(180deg, ${C.brownL}, ${C.brown})`,
                borderRadius: "0 0 8px 8px",
                border: `2px solid ${C.brownD}`,
                boxShadow: `0 4px 10px ${C.brownD}44`,
                zIndex: 10,
              }} />

              {/* 왼쪽 분류함 - 딸기요거롤 */}
              <div style={{
                position: "absolute", left: 12, bottom: 14,
                width: "clamp(70px, 16vw, 108px)",
                height: "clamp(74px, 15vh, 118px)",
                borderRadius: "50% 50% 20px 20px / 30% 30% 20px 20px",
                border: `2.5px solid ${C.pink}88`,
                background: `linear-gradient(160deg, ${C.pinkL}ee, ${C.cream}ee)`,
                backdropFilter: "blur(6px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                boxShadow: `0 6px 20px ${C.pink}28, 0 2px 0 ${C.white}88 inset`,
                // 글로우 애니메이션
                "--glow-color": `${C.pink}44`,
                animation: "s9-pulse-glow 2.5s ease-in-out infinite",
              } as React.CSSProperties}>
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🍰</span>
                <span style={{
                  fontSize: "0.56rem", fontWeight: 800,
                  color: C.pinkD, fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center", lineHeight: 1.4,
                }}>A / ←<br />딸기요거롤</span>
              </div>

              {/* 오른쪽 분류함 - 반지 */}
              <div style={{
                position: "absolute", right: 12, bottom: 14,
                width: "clamp(70px, 16vw, 108px)",
                height: "clamp(74px, 15vh, 118px)",
                borderRadius: "50% 50% 20px 20px / 30% 30% 20px 20px",
                border: `2.5px solid ${C.gold}88`,
                background: `linear-gradient(160deg, ${C.goldL}ee, ${C.cream}ee)`,
                backdropFilter: "blur(6px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                boxShadow: `0 6px 20px ${C.gold}28, 0 2px 0 ${C.white}88 inset`,
                "--glow-color": `${C.gold}44`,
                animation: "s9-pulse-glow 2.5s ease-in-out infinite",
                animationDelay: "0.8s",
              } as React.CSSProperties}>
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>💍</span>
                <span style={{
                  fontSize: "0.56rem", fontWeight: 800,
                  color: C.goldD, fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center", lineHeight: 1.4,
                }}>D / →<br />반지</span>
              </div>

              {/* ── 아이템 (원형 접시 스타일) ── */}
              {items.map((item) => {
                const isStrawberry = item.type === "strawberryRoll";
                const mainColor = isStrawberry ? C.pink : C.gold;
                const lightColor = isStrawberry ? C.pinkL : C.goldL;
                const darkColor = isStrawberry ? C.pinkD : C.goldD;
                const emoji = isStrawberry ? "🍰" : "💍";
                const size = "clamp(60px, 12vw, 88px)";

                return (
                  <div
                    key={item.id}
                    className="s9-item"
                    style={{
                      position: "absolute",
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: size, height: size,
                      transform: "translate(-50%, -50%)",
                      zIndex: Math.round(item.y),
                    }}
                    aria-label={ITEM_LABEL[item.type]}
                  >
                    {/* 후광 (halo) */}
                    <div style={{
                      position: "absolute",
                      left: "50%", top: "50%",
                      width: "140%", height: "140%",
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${mainColor}44 0%, transparent 70%)`,
                      animation: "s9-halo 2s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />

                    {/* 접시 (원형) */}
                    <div style={{
                      position: "absolute", inset: 0,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 32% 28%, ${C.white} 0%, ${lightColor} 55%, ${mainColor}44 100%)`,
                      border: `3px solid ${mainColor}`,
                      boxShadow: `
                        0 6px 22px ${mainColor}55,
                        0 2px 0 ${C.white}cc inset,
                        0 -2px 0 ${mainColor}44 inset
                      `,
                    }} />

                    {/* 접시 테두리 장식 (점선 링) */}
                    <div style={{
                      position: "absolute", inset: 4,
                      borderRadius: "50%",
                      border: `1.5px dashed ${mainColor}66`,
                      pointerEvents: "none",
                    }} />

                    {/* 이모지 */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "clamp(1.6rem, 5.5vw, 2.6rem)",
                      filter: `drop-shadow(0 2px 6px ${mainColor}66)`,
                    }}>
                      {emoji}
                    </div>

                    {/* 반짝이 (반지일 때) */}
                    {!isStrawberry && (
                      <>
                        <div style={{
                          position: "absolute", top: "8%", right: "10%",
                          fontSize: "0.55rem",
                          animation: "s9-spin-slow 3s linear infinite",
                        }}>✦</div>
                        <div style={{
                          position: "absolute", bottom: "10%", left: "12%",
                          fontSize: "0.45rem",
                          animation: "s9-spin-slow 2.2s linear infinite reverse",
                        }}>✧</div>
                      </>
                    )}

                    {/* 딸기 잎 장식 (딸기요거롤일 때) */}
                    {isStrawberry && (
                      <div style={{
                        position: "absolute", top: "4%", right: "8%",
                        fontSize: "0.55rem",
                        animation: "s9-float 1.8s ease-in-out infinite",
                      }}>🌿</div>
                    )}

                    {/* 하단 라벨 */}
                    <div style={{
                      position: "absolute", bottom: "-18px", left: "50%",
                      transform: "translateX(-50%)",
                      background: `linear-gradient(135deg, ${mainColor}, ${darkColor})`,
                      color: C.white, borderRadius: 999,
                      padding: "1.5px 8px",
                      fontSize: "clamp(0.36rem, 1.1vw, 0.50rem)",
                      fontFamily: "'Gowun Dodum', sans-serif",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      boxShadow: `0 2px 8px ${mainColor}44`,
                    }}>
                      {ITEM_LABEL[item.type]}
                    </div>
                  </div>
                );
              })}

              {/* 피드백 텍스트 */}
              {feedbacks.map((fb, idx) => (
                <div
                  key={fb.id}
                  className="s9-feedback"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: `${12 + idx * 12}%`,
                    transform: "translateX(-50%)",
                    color: fb.isGood ? C.pinkD : C.strawberry,
                    fontSize: "clamp(1.1rem, 4vw, 1.9rem)",
                    fontWeight: 900,
                    fontFamily: "'Gowun Dodum', sans-serif",
                    textShadow: `0 2px 12px ${fb.isGood ? C.pink : C.strawberry}88`,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fb.text}
                </div>
              ))}
            </div>

            {/* 조작 버튼 */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => handleSort("left")}
                style={{
                  background: `linear-gradient(135deg, ${C.pink} 0%, ${C.pinkM} 100%)`,
                  color: C.white, border: "none", borderRadius: 999,
                  padding: "0.88rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700, fontSize: "0.90rem", cursor: "pointer",
                  boxShadow: `0 5px 18px ${C.pink}55, 0 2px 0 ${C.white}44 inset`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "transform 0.08s, box-shadow 0.08s",
                  active: { transform: "scale(0.95)" },
                } as React.CSSProperties}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ fontSize: "1.1rem" }}>←</span>
                <span>🍰 딸기요거롤</span>
              </button>
              <button
                onClick={() => handleSort("right")}
                style={{
                  background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldM} 100%)`,
                  color: C.white, border: "none", borderRadius: 999,
                  padding: "0.88rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700, fontSize: "0.90rem", cursor: "pointer",
                  boxShadow: `0 5px 18px ${C.gold}55, 0 2px 0 ${C.white}44 inset`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "transform 0.08s, box-shadow 0.08s",
                } as React.CSSProperties}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span>💍 반지</span>
                <span style={{ fontSize: "1.1rem" }}>→</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </GameLayout>
  );
}