/*
 * Stage 9 - 대전 1주년: 딸기요거롤/반지 컨베이어 분류 게임
 * 디자인 v4: 동물의 숲 × 성심당 마을 장터
 *   - 배경: 연두/복숭아/크림 파스텔, 잔디·꽃밭·나뭇잎 장식
 *   - 아이템: 귀여운 동물 캐릭터 얼굴 + 나무 바구니 스타일
 *   - 컨베이어: 나무 선반 → 꽃잎이 흩날리는 마을 길 느낌
 *   - 분류함: 나무 바구니 + 꽃 장식
 *   - 피드백: 동물의 숲 마을 주민 반응 느낌
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

const GOOD_FEEDBACKS = ["🍃 굿이에요!", "🌸 완벽해요!", "🐻 정답!", "🍀 맞아요!", "🌼 +1!", "🦝 굿!"];
const BAD_FEEDBACKS  = ["🍂 앗!", "🐸 반대예요!", "🌿 아이쿠!", "🦔 틀렸어요!"];

const TARGET_SCORE        = 20;
const PENALTY             = 5;
const SPAWN_INTERVAL_MS   = 400;
const ITEM_SPEED_PER_SECOND = 50;

function createItem(id: number, y = -16): ConveyorItem {
  return {
    id,
    type: Math.random() > 0.5 ? "strawberryRoll" : "ring",
    x: 42 + Math.random() * 16,
    y,
  };
}

// 동물의 숲 감성 팔레트
const AC = {
  // 기본 배경
  grass:     "#c8e6a0",   // 연두 잔디
  grassD:    "#a8cc78",   // 진한 잔디
  grassL:    "#e8f5c8",   // 연한 잔디
  sky:       "#d4eeff",   // 하늘
  // 크림/복숭아
  cream:     "#fff9f0",
  peach:     "#ffd8b0",
  peachL:    "#fff0e0",
  peachD:    "#e8a060",
  // 핑크/딸기
  pink:      "#ffb8c8",
  pinkL:     "#ffe8f0",
  pinkD:     "#e06080",
  pinkM:     "#ff8098",
  strawberry:"#e84848",
  // 골드/링
  gold:      "#f0c840",
  goldL:     "#fff8d0",
  goldD:     "#c89020",
  goldM:     "#e8a820",
  // 나무/흙
  wood:      "#c8a878",
  woodL:     "#e8d8b8",
  woodD:     "#906840",
  woodM:     "#b09060",
  // 텍스트
  textD:     "#5a4030",
  textM:     "#8a6850",
  textL:     "#b89878",
  // 기타
  white:     "#ffffff",
  mint:      "#b8e8d8",
  mintL:     "#e0f8f0",
  lavender:  "#d8c8f0",
  leaf:      "#78c850",
  leafD:     "#508830",
};

export default function Stage09SortBreadRingGame({ stage, onComplete }: Props) {
  const nextIdRef          = useRef(0);
  const animationFrameRef  = useRef<number | null>(null);
  const lastFrameTimeRef   = useRef<number | null>(null);
  const feedbackIdRef      = useRef(0);
  const itemsRef           = useRef<ConveyorItem[]>([]);

  const [started,    setStarted]    = useState(false);
  const [cleared,    setCleared]    = useState(false);
  const [items,      setItems]      = useState<ConveyorItem[]>([]);
  const [score,      setScore]      = useState(0);
  const [message,    setMessage]    = useState("마을 장터에 온 걸 환영해요!");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [feedbacks,  setFeedbacks]  = useState<Feedback[]>([]);

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
    nextIdRef.current        = 0;
    lastFrameTimeRef.current = null;
    const init = [createItem(nextIdRef.current++, -6), createItem(nextIdRef.current++, -38)];
    setScore(0);
    itemsRef.current = init;
    setItems(init);
    setMessage("🍓 딸기요거롤은 왼쪽 바구니, 💍 반지는 오른쪽 바구니!");
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
    nextIdRef.current        = 0;
    lastFrameTimeRef.current = null;
    setStarted(false);
    setCleared(false);
    itemsRef.current = [];
    setItems([]);
    setScore(0);
    setMessage("마을 장터에 온 걸 환영해요!");
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
          if (ns >= TARGET_SCORE) window.setTimeout(() => setCleared(true), 260);
          return ns;
        });
        setMessage(`${ITEM_LABEL[front.type]} 바구니에 쏙! 🌸`);
        addFeedback(GOOD_FEEDBACKS[Math.floor(Math.random() * GOOD_FEEDBACKS.length)], true);
      } else {
        setScore((s) => Math.max(0, s - PENALTY));
        setMessage(`반대 바구니예요! -${PENALTY}점 🍂`);
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
      if (e.key === "ArrowLeft"  || e.key.toLowerCase() === "a") { e.preventDefault(); handleSort("left"); }
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
      hintText="🍓 딸기요거롤은 왼쪽 바구니 / 💍 반지는 오른쪽 바구니! 가장 아래쪽 아이템부터 분류해요"
      onRetry={resetGame}
    >
      <style>{`
        @keyframes s9-path {
          from { background-position-y: 0; }
          to   { background-position-y: 48px; }
        }
        @keyframes s9-item-drop {
          0%   { transform: translate(-50%,-50%) scale(0.5) rotate(-8deg); opacity:0; }
          60%  { transform: translate(-50%,-50%) scale(1.1) rotate(2deg);  opacity:1; }
          80%  { transform: translate(-50%,-50%) scale(0.97) rotate(-1deg); }
          100% { transform: translate(-50%,-50%) scale(1) rotate(0deg);    opacity:1; }
        }
        @keyframes s9-feedback-up {
          0%   { transform: translateX(-50%) translateY(0)    scale(1);    opacity:1; }
          100% { transform: translateX(-50%) translateY(-44px) scale(1.3); opacity:0; }
        }
        @keyframes s9-wrong-shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-6px) rotate(-1deg); }
          35%     { transform: translateX(6px)  rotate(1deg); }
          55%     { transform: translateX(-4px) rotate(-0.5deg); }
          75%     { transform: translateX(4px)  rotate(0.5deg); }
        }
        @keyframes s9-float {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%     { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes s9-leaf-fall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(120px) rotate(180deg); opacity: 0; }
        }
        @keyframes s9-petal-drift {
          0%   { transform: translateX(0) translateY(-5px) rotate(0deg); opacity: 0.7; }
          100% { transform: translateX(30px) translateY(100px) rotate(270deg); opacity: 0; }
        }
        @keyframes s9-pulse-soft {
          0%,100% { box-shadow: 0 4px 16px var(--glow-color); }
          50%     { box-shadow: 0 6px 28px var(--glow-color); }
        }
        @keyframes s9-bounce-in {
          0%   { transform: scale(0.7); opacity:0; }
          65%  { transform: scale(1.05); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes s9-sway {
          0%,100% { transform: rotate(-3deg); }
          50%     { transform: rotate(3deg); }
        }
        @keyframes s9-sparkle {
          0%,100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
          50%     { opacity: 1;   transform: scale(1.2) rotate(180deg); }
        }
        .s9-item { animation: s9-item-drop 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .s9-feedback { animation: s9-feedback-up 0.82s ease-out forwards; }
        .s9-deco { animation: s9-float 3s ease-in-out infinite; }
        .s9-bounce-in { animation: s9-bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .s9-sway { animation: s9-sway 2.5s ease-in-out infinite; }
        .s9-sparkle { animation: s9-sparkle 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── 시작 화면 ── */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            className="p-7 text-center max-w-sm w-full"
            style={{
              background: `linear-gradient(160deg, ${AC.cream} 0%, ${AC.peachL} 45%, ${AC.grassL} 100%)`,
              border: `2.5px solid ${AC.wood}88`,
              borderRadius: 32,
              boxShadow: `0 12px 40px ${AC.woodD}22, 0 3px 0 ${AC.white} inset, 0 -2px 0 ${AC.woodL} inset`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 배경 잔디 텍스처 */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 32, pointerEvents: "none",
              background: `
                radial-gradient(ellipse at 20% 90%, ${AC.grass}44 0%, transparent 50%),
                radial-gradient(ellipse at 80% 85%, ${AC.grassD}33 0%, transparent 45%)
              `,
            }} />

            {/* 상단 나무 표지판 느낌 장식 */}
            <div style={{
              position: "relative", height: 80, marginBottom: 8,
            }}>
              {/* 중앙 큰 이모지 */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: "3rem", lineHeight: 1,
                filter: `drop-shadow(0 4px 10px ${AC.peachD}55)`,
              }}>🏪</div>
              {/* 주변 장식 이모지들 */}
              {[
                { e: "🍓", angle: 0,   r: 34 },
                { e: "💍", angle: 60,  r: 34 },
                { e: "🌸", angle: 120, r: 34 },
                { e: "🍃", angle: 180, r: 34 },
                { e: "🌼", angle: 240, r: 34 },
                { e: "🦝", angle: 300, r: 34 },
              ].map(({ e, angle, r }) => (
                <div key={angle} style={{
                  position: "absolute",
                  left: `calc(50% + ${Math.cos((angle - 90) * Math.PI / 180) * r}px)`,
                  top:  `calc(50% + ${Math.sin((angle - 90) * Math.PI / 180) * r}px)`,
                  transform: "translate(-50%,-50%)",
                  fontSize: "1.1rem",
                  animation: `s9-float ${2.2 + angle / 200}s ease-in-out infinite`,
                  animationDelay: `${angle / 360}s`,
                }}>
                  {e}
                </div>
              ))}
            </div>

            {/* 나무 표지판 스타일 제목 */}
            <div style={{
              display: "inline-block",
              background: `linear-gradient(180deg, ${AC.wood} 0%, ${AC.woodD} 100%)`,
              borderRadius: 12,
              padding: "8px 20px",
              marginBottom: 10,
              boxShadow: `0 4px 0 ${AC.woodD}, 0 6px 12px ${AC.woodD}44`,
              border: `2px solid ${AC.woodD}`,
            }}>
              <h2 style={{
                fontSize: "1.18rem", fontWeight: 800, margin: 0,
                color: AC.cream, fontFamily: "'Gowun Dodum', sans-serif",
                textShadow: `0 1px 3px ${AC.woodD}88`,
                letterSpacing: "0.02em",
              }}>
                성심당 마을 장터 🏪
              </h2>
            </div>

            <p style={{
              fontSize: "0.72rem", color: AC.peachD,
              fontFamily: "'Gowun Dodum', sans-serif",
              marginBottom: 16, fontWeight: 700,
            }}>
              대전 1주년 기념 데이트 🌸
            </p>

            {/* 분류 안내 - 바구니 스타일 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {/* 딸기요거롤 바구니 */}
              <div style={{
                flex: 1, padding: "12px 8px", borderRadius: 20,
                background: `linear-gradient(160deg, ${AC.pinkL}, ${AC.cream})`,
                border: `2px solid ${AC.pink}88`,
                boxShadow: `0 4px 14px ${AC.pink}22, 0 2px 0 ${AC.white}88 inset`,
                fontFamily: "'Gowun Dodum', sans-serif",
                position: "relative",
              }}>
                {/* 바구니 이모지 */}
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                  background: `radial-gradient(circle at 35% 35%, ${AC.white}, ${AC.pinkL})`,
                  border: `3px solid ${AC.pink}77`,
                  boxShadow: `0 4px 12px ${AC.pink}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem",
                }}>🍓</div>
                <div style={{ fontSize: "0.60rem", fontWeight: 800, color: AC.pinkD, marginBottom: 2 }}>딸기요거롤</div>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${AC.pink}, ${AC.pinkM})`,
                  color: AC.white, borderRadius: 999,
                  padding: "2px 10px", fontSize: "0.58rem", fontWeight: 700,
                }}>← 왼쪽 🧺</div>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", color: AC.leaf, flexShrink: 0,
              }}>🌿</div>

              {/* 반지 바구니 */}
              <div style={{
                flex: 1, padding: "12px 8px", borderRadius: 20,
                background: `linear-gradient(160deg, ${AC.goldL}, ${AC.cream})`,
                border: `2px solid ${AC.gold}88`,
                boxShadow: `0 4px 14px ${AC.gold}22, 0 2px 0 ${AC.white}88 inset`,
                fontFamily: "'Gowun Dodum', sans-serif",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                  background: `radial-gradient(circle at 35% 35%, ${AC.white}, ${AC.goldL})`,
                  border: `3px solid ${AC.gold}77`,
                  boxShadow: `0 4px 12px ${AC.gold}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem",
                }}>💍</div>
                <div style={{ fontSize: "0.60rem", fontWeight: 800, color: AC.goldD, marginBottom: 2 }}>반지</div>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${AC.gold}, ${AC.goldM})`,
                  color: AC.white, borderRadius: 999,
                  padding: "2px 10px", fontSize: "0.58rem", fontWeight: 700,
                }}>🧺 오른쪽 →</div>
              </div>
            </div>

            <p style={{
              fontSize: "0.76rem", lineHeight: 1.8, marginBottom: 20,
              color: AC.textM, fontFamily: "'Gowun Dodum', sans-serif",
            }}>
              마을 길을 따라 내려오는 물건을<br />
              바구니에 쏙쏙 담아줘요! 🌼
            </p>

            {/* 나무 표지판 스타일 버튼 */}
            <button
              className="btn-star"
              onClick={beginGame}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${AC.leaf} 0%, ${AC.grassD} 100%)`,
                borderRadius: 999,
                border: `2px solid ${AC.leafD}`,
                padding: "0.9rem",
                fontSize: "0.95rem",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontWeight: 700,
                color: AC.white,
                boxShadow: `0 5px 0 ${AC.leafD}, 0 8px 20px ${AC.leaf}44`,
                cursor: "pointer",
                textShadow: `0 1px 3px ${AC.leafD}88`,
              }}
            >
              🌱 장터 시작하기
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
              minHeight: 28, marginBottom: 8, textAlign: "center",
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "0.88rem", fontWeight: 700,
              color: message.includes("-") || message.includes("반대") ? AC.strawberry : AC.textD,
              textShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "color 0.2s",
            }}>
              {message}
            </div>

            {/* 프로그레스 - 나무 표지판 스타일 */}
            <div style={{
              marginBottom: 10, borderRadius: 16,
              background: `linear-gradient(135deg, ${AC.woodL}ee, ${AC.cream}ee)`,
              border: `1.5px solid ${AC.wood}66`,
              padding: "7px 12px",
              boxShadow: `0 2px 8px ${AC.woodD}14`,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 5,
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.70rem", fontWeight: 700, color: AC.textD,
              }}>
                <span>🧺 {score} / {TARGET_SCORE}개 담음</span>
                <span style={{ color: AC.leaf }}>{progress}%</span>
              </div>
              <div style={{
                height: 10, borderRadius: 999,
                background: `${AC.woodL}88`,
                overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
              }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${AC.leaf}, ${AC.gold})`,
                  transition: "width 200ms ease",
                  position: "relative", overflow: "hidden",
                  boxShadow: `0 0 10px ${AC.leaf}88`,
                }}>
                  {/* 꽃잎 패턴 */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "repeating-linear-gradient(90deg,transparent 0 10px,rgba(255,255,255,0.25) 10px 14px)",
                  }} />
                </div>
              </div>
            </div>

            {/* ── 마을 길 필드 ── */}
            <div
              style={{
                position: "relative",
                height: "clamp(330px, 50vh, 500px)",
                borderRadius: 28,
                overflow: "hidden",
                border: `2.5px solid ${AC.wood}99`,
                boxShadow: `0 16px 48px ${AC.woodD}22, 0 3px 0 ${AC.white}cc inset`,
                // 동물의 숲 마을 배경 - 하늘 + 잔디
                background: `
                  radial-gradient(ellipse at 20% 5%,  ${AC.sky}cc       0%, transparent 45%),
                  radial-gradient(ellipse at 80% 8%,  ${AC.peachL}aa    0%, transparent 40%),
                  radial-gradient(ellipse at 50% 95%, ${AC.grass}cc     0%, transparent 55%),
                  radial-gradient(ellipse at 15% 85%, ${AC.grassD}88    0%, transparent 40%),
                  radial-gradient(ellipse at 85% 80%, ${AC.grassL}99    0%, transparent 40%),
                  linear-gradient(180deg, #e8f4ff 0%, ${AC.cream} 35%, ${AC.peachL} 60%, ${AC.grassL} 100%)
                `,
              }}
            >
              {/* 잔디 바닥 레이어 */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "28%",
                background: `linear-gradient(180deg, ${AC.grassL} 0%, ${AC.grass} 40%, ${AC.grassD} 100%)`,
                borderRadius: "50% 50% 0 0 / 20% 20% 0 0",
                pointerEvents: "none",
              }} />

              {/* 잔디 위 꽃들 */}
              {[
                { e: "🌸", x: "5%",  y: "76%", s: "1.1rem", d: "0s"   },
                { e: "🌼", x: "88%", y: "78%", s: "1.0rem", d: "0.5s" },
                { e: "🌺", x: "12%", y: "82%", s: "0.9rem", d: "1.0s" },
                { e: "🌻", x: "80%", y: "80%", s: "1.0rem", d: "0.7s" },
                { e: "🍀", x: "3%",  y: "86%", s: "0.8rem", d: "1.3s" },
                { e: "🌿", x: "91%", y: "84%", s: "0.9rem", d: "0.3s" },
              ].map((d, i) => (
                <div key={i} className="s9-deco" style={{
                  position: "absolute", left: d.x, top: d.y,
                  fontSize: d.s, opacity: 0.7,
                  pointerEvents: "none", userSelect: "none",
                  animationDelay: d.d,
                }}>{d.e}</div>
              ))}

              {/* 나무 장식 (좌우) */}
              <div style={{
                position: "absolute", left: "2%", top: "5%",
                fontSize: "2.2rem", opacity: 0.55,
                pointerEvents: "none",
                animation: "s9-sway 3s ease-in-out infinite",
                transformOrigin: "bottom center",
              }}>🌳</div>
              <div style={{
                position: "absolute", right: "2%", top: "8%",
                fontSize: "1.9rem", opacity: 0.5,
                pointerEvents: "none",
                animation: "s9-sway 3.5s ease-in-out infinite",
                animationDelay: "1s",
                transformOrigin: "bottom center",
              }}>🌲</div>

              {/* 구름 장식 */}
              {[
                { x: "8%",  y: "6%",  s: "1.4rem", d: "0s"   },
                { x: "72%", y: "4%",  s: "1.2rem", d: "1.2s" },
                { x: "40%", y: "2%",  s: "1.0rem", d: "0.6s" },
              ].map((d, i) => (
                <div key={i} className="s9-deco" style={{
                  position: "absolute", left: d.x, top: d.y,
                  fontSize: d.s, opacity: 0.45,
                  pointerEvents: "none", userSelect: "none",
                  animationDelay: d.d,
                }}>☁️</div>
              ))}

              {/* 마을 길 (중앙 흙길) */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%", top: 0, bottom: 0,
                  width: "min(44vw, 240px)",
                  transform: "translateX(-50%)",
                  // 흙길 패턴
                  background: `
                    repeating-linear-gradient(
                      180deg,
                      ${AC.peach}cc 0 20px,
                      ${AC.peachD}44 20px 22px,
                      ${AC.peach}cc 22px 42px,
                      ${AC.woodL}55 42px 44px
                    )
                  `,
                  borderLeft:  `4px solid ${AC.wood}88`,
                  borderRight: `4px solid ${AC.wood}88`,
                  boxShadow: `
                    inset 10px 0 20px rgba(255,255,255,0.15),
                    inset -10px 0 20px rgba(0,0,0,0.08),
                    5px 0 15px ${AC.wood}22,
                    -5px 0 15px ${AC.wood}22
                  `,
                  animation: "s9-path 0.7s linear infinite",
                }}
              />

              {/* 길 가장자리 꽃 장식 */}
              <div aria-hidden style={{
                position: "absolute",
                left: "50%", top: 0, bottom: 0,
                width: "min(44vw, 240px)",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}>
                {/* 왼쪽 경계 꽃 장식선 */}
                <div style={{
                  position: "absolute", left: -8, top: 0, bottom: 0, width: 8,
                  background: `repeating-linear-gradient(180deg, ${AC.pink}66 0 6px, transparent 6px 14px)`,
                }} />
                {/* 오른쪽 경계 꽃 장식선 */}
                <div style={{
                  position: "absolute", right: -8, top: 0, bottom: 0, width: 8,
                  background: `repeating-linear-gradient(180deg, ${AC.gold}66 0 6px, transparent 6px 14px)`,
                }} />
              </div>

              {/* 왼쪽 분류 바구니 - 딸기요거롤 */}
              <div style={{
                position: "absolute", left: 10, bottom: 12,
                width: "clamp(68px, 15vw, 105px)",
                height: "clamp(72px, 14vh, 115px)",
                borderRadius: "12px 12px 20px 20px",
                border: `2.5px solid ${AC.wood}aa`,
                background: `linear-gradient(160deg, ${AC.pinkL}ee, ${AC.cream}ee)`,
                backdropFilter: "blur(6px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                boxShadow: `0 6px 18px ${AC.pink}28, 0 3px 0 ${AC.woodL}88 inset, 0 -2px 0 ${AC.wood}44 inset`,
                "--glow-color": `${AC.pink}44`,
                animation: "s9-pulse-soft 2.5s ease-in-out infinite",
                // 바구니 느낌 하단 테두리
                borderBottom: `4px solid ${AC.wood}cc`,
              } as React.CSSProperties}>
                {/* 바구니 손잡이 */}
                <div style={{
                  position: "absolute", top: -10, left: "50%",
                  transform: "translateX(-50%)",
                  width: 36, height: 12,
                  border: `2.5px solid ${AC.wood}cc`,
                  borderBottom: "none",
                  borderRadius: "50% 50% 0 0",
                  background: "transparent",
                }} />
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🍓</span>
                <span style={{
                  fontSize: "0.56rem", fontWeight: 800,
                  color: AC.pinkD, fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center", lineHeight: 1.4,
                }}>A / ←<br />딸기요거롤</span>
              </div>

              {/* 오른쪽 분류 바구니 - 반지 */}
              <div style={{
                position: "absolute", right: 10, bottom: 12,
                width: "clamp(68px, 15vw, 105px)",
                height: "clamp(72px, 14vh, 115px)",
                borderRadius: "12px 12px 20px 20px",
                border: `2.5px solid ${AC.wood}aa`,
                background: `linear-gradient(160deg, ${AC.goldL}ee, ${AC.cream}ee)`,
                backdropFilter: "blur(6px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                boxShadow: `0 6px 18px ${AC.gold}28, 0 3px 0 ${AC.woodL}88 inset, 0 -2px 0 ${AC.wood}44 inset`,
                "--glow-color": `${AC.gold}44`,
                animation: "s9-pulse-soft 2.5s ease-in-out infinite",
                animationDelay: "0.8s",
                borderBottom: `4px solid ${AC.wood}cc`,
              } as React.CSSProperties}>
                {/* 바구니 손잡이 */}
                <div style={{
                  position: "absolute", top: -10, left: "50%",
                  transform: "translateX(-50%)",
                  width: 36, height: 12,
                  border: `2.5px solid ${AC.wood}cc`,
                  borderBottom: "none",
                  borderRadius: "50% 50% 0 0",
                  background: "transparent",
                }} />
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>💍</span>
                <span style={{
                  fontSize: "0.56rem", fontWeight: 800,
                  color: AC.goldD, fontFamily: "'Gowun Dodum', sans-serif",
                  textAlign: "center", lineHeight: 1.4,
                }}>D / →<br />반지</span>
              </div>

              {/* ── 아이템 (동물의 숲 스타일 둥근 카드) ── */}
              {items.map((item) => {
                const isStrawberry = item.type === "strawberryRoll";
                const mainColor  = isStrawberry ? AC.pink  : AC.gold;
                const lightColor = isStrawberry ? AC.pinkL : AC.goldL;
                const darkColor  = isStrawberry ? AC.pinkD : AC.goldD;
                const emoji      = isStrawberry ? "🍓"    : "💍";
                const bgEmoji    = isStrawberry ? "🌸"    : "✨";
                const size = "clamp(58px, 11vw, 84px)";

                return (
                  <div
                    key={item.id}
                    className="s9-item"
                    style={{
                      position: "absolute",
                      left: `${item.x}%`,
                      top:  `${item.y}%`,
                      width: size, height: size,
                      transform: "translate(-50%, -50%)",
                      zIndex: Math.round(item.y),
                    }}
                    aria-label={ITEM_LABEL[item.type]}
                  >
                    {/* 부드러운 그림자 */}
                    <div style={{
                      position: "absolute",
                      left: "10%", top: "60%",
                      width: "80%", height: "30%",
                      borderRadius: "50%",
                      background: `${mainColor}33`,
                      filter: "blur(4px)",
                      pointerEvents: "none",
                    }} />

                    {/* 동물의 숲 스타일 둥근 카드 */}
                    <div style={{
                      position: "absolute", inset: 0,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 30% 25%, ${AC.white} 0%, ${lightColor} 50%, ${mainColor}55 100%)`,
                      border: `3px solid ${mainColor}bb`,
                      boxShadow: `
                        0 5px 18px ${mainColor}44,
                        0 2px 0 ${AC.white}cc inset,
                        0 -1px 0 ${mainColor}33 inset
                      `,
                    }} />

                    {/* 안쪽 꽃무늬 테두리 */}
                    <div style={{
                      position: "absolute", inset: 5,
                      borderRadius: "50%",
                      border: `1.5px dotted ${mainColor}55`,
                      pointerEvents: "none",
                    }} />

                    {/* 메인 이모지 */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "clamp(1.5rem, 5vw, 2.4rem)",
                      filter: `drop-shadow(0 2px 5px ${mainColor}55)`,
                    }}>
                      {emoji}
                    </div>

                    {/* 반짝이 장식 */}
                    <div className="s9-sparkle" style={{
                      position: "absolute", top: "5%", right: "8%",
                      fontSize: "0.55rem", color: mainColor,
                    }}>{bgEmoji}</div>
                    <div className="s9-sparkle" style={{
                      position: "absolute", bottom: "8%", left: "10%",
                      fontSize: "0.45rem", color: darkColor,
                      animationDelay: "0.9s",
                    }}>✦</div>

                    {/* 하단 라벨 - 나무 표지판 스타일 */}
                    <div style={{
                      position: "absolute", bottom: "-20px", left: "50%",
                      transform: "translateX(-50%)",
                      background: `linear-gradient(135deg, ${AC.wood}, ${AC.woodD})`,
                      color: AC.cream, borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: "clamp(0.36rem, 1.1vw, 0.50rem)",
                      fontFamily: "'Gowun Dodum', sans-serif",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      boxShadow: `0 2px 6px ${AC.woodD}44, 0 1px 0 ${AC.woodL}44 inset`,
                      border: `1px solid ${AC.woodD}66`,
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
                    color: fb.isGood ? AC.leafD : AC.strawberry,
                    fontSize: "clamp(1.0rem, 3.5vw, 1.7rem)",
                    fontWeight: 900,
                    fontFamily: "'Gowun Dodum', sans-serif",
                    textShadow: `0 2px 10px ${fb.isGood ? AC.leaf : AC.strawberry}88`,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fb.text}
                </div>
              ))}
            </div>

            {/* 조작 버튼 - 동물의 숲 나무 버튼 스타일 */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => handleSort("left")}
                style={{
                  background: `linear-gradient(135deg, ${AC.pink} 0%, ${AC.pinkM} 100%)`,
                  color: AC.white, border: `2px solid ${AC.pinkD}`,
                  borderRadius: 20,
                  padding: "0.85rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                  boxShadow: `0 4px 0 ${AC.pinkD}, 0 6px 16px ${AC.pink}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "transform 0.08s, box-shadow 0.08s",
                } as React.CSSProperties}
                onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = `0 1px 0 ${AC.pinkD}, 0 3px 8px ${AC.pink}44`; }}
                onMouseUp={(e)   => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 0 ${AC.pinkD}, 0 6px 16px ${AC.pink}44`; }}
                onTouchStart={(e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = `0 1px 0 ${AC.pinkD}, 0 3px 8px ${AC.pink}44`; }}
                onTouchEnd={(e)   => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 0 ${AC.pinkD}, 0 6px 16px ${AC.pink}44`; }}
              >
                <span style={{ fontSize: "1.1rem" }}>←</span>
                <span>🍓 딸기요거롤</span>
              </button>
              <button
                onClick={() => handleSort("right")}
                style={{
                  background: `linear-gradient(135deg, ${AC.gold} 0%, ${AC.goldM} 100%)`,
                  color: AC.white, border: `2px solid ${AC.goldD}`,
                  borderRadius: 20,
                  padding: "0.85rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                  boxShadow: `0 4px 0 ${AC.goldD}, 0 6px 16px ${AC.gold}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "transform 0.08s, box-shadow 0.08s",
                } as React.CSSProperties}
                onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = `0 1px 0 ${AC.goldD}, 0 3px 8px ${AC.gold}44`; }}
                onMouseUp={(e)   => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 0 ${AC.goldD}, 0 6px 16px ${AC.gold}44`; }}
                onTouchStart={(e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = `0 1px 0 ${AC.goldD}, 0 3px 8px ${AC.gold}44`; }}
                onTouchEnd={(e)   => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 0 ${AC.goldD}, 0 6px 16px ${AC.gold}44`; }}
              >
                <span>💍 반지</span>
                <span style={{ fontSize: "1.1rem" }}>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 클리어 화면 ── */}
      {cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            className="p-8 text-center max-w-sm w-full s9-bounce-in"
            style={{
              background: `linear-gradient(160deg, ${AC.cream} 0%, ${AC.peachL} 45%, ${AC.grassL} 100%)`,
              border: `2.5px solid ${AC.wood}99`,
              borderRadius: 32,
              boxShadow: `0 16px 48px ${AC.woodD}22, 0 3px 0 ${AC.white} inset`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 배경 잔디 */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 32, pointerEvents: "none",
              background: `
                radial-gradient(ellipse at 20% 90%, ${AC.grass}55 0%, transparent 50%),
                radial-gradient(ellipse at 80% 85%, ${AC.grassD}44 0%, transparent 45%)
              `,
            }} />

            <div style={{ fontSize: "2.2rem", letterSpacing: "0.12em", marginBottom: 10, position: "relative" }}>
              🎉🌸💍🍓🎉
            </div>

            {/* 나무 표지판 제목 */}
            <div style={{
              display: "inline-block",
              background: `linear-gradient(180deg, ${AC.wood} 0%, ${AC.woodD} 100%)`,
              borderRadius: 12,
              padding: "8px 20px",
              marginBottom: 12,
              boxShadow: `0 4px 0 ${AC.woodD}, 0 6px 12px ${AC.woodD}44`,
              border: `2px solid ${AC.woodD}`,
            }}>
              <h2 style={{
                fontSize: "1.18rem", fontWeight: 800, margin: 0,
                color: AC.cream, fontFamily: "'Gowun Dodum', sans-serif",
                textShadow: `0 1px 3px ${AC.woodD}88`,
              }}>
                1주년 데이트 완료! 🥂
              </h2>
            </div>

            <p style={{
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "0.82rem", color: AC.textM, lineHeight: 1.9, marginBottom: 6,
              position: "relative",
            }}>
              반지도 만들고<br />딸기요거롤도 챙겼다 🍓
            </p>
            <p style={{
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "0.72rem", color: AC.leaf,
              marginBottom: 20, fontWeight: 700,
              position: "relative",
            }}>
              🌿 성심당 마을에서의 달콤한 하루 🌿
            </p>

            {/* 꽃 장식 구분선 */}
            <div style={{
              height: 3, borderRadius: 999, marginBottom: 20,
              background: `repeating-linear-gradient(90deg, ${AC.pink} 0 8px, ${AC.leaf} 8px 16px, ${AC.gold} 16px 24px, ${AC.grassL} 24px 32px)`,
              position: "relative",
            }} />

            <button
              className="btn-star"
              onClick={onComplete}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${AC.leaf} 0%, ${AC.grassD} 100%)`,
                borderRadius: 999,
                border: `2px solid ${AC.leafD}`,
                padding: "0.9rem", fontSize: "0.95rem",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontWeight: 700, color: AC.white,
                boxShadow: `0 5px 0 ${AC.leafD}, 0 8px 20px ${AC.leaf}44`,
                cursor: "pointer",
                textShadow: `0 1px 3px ${AC.leafD}88`,
                position: "relative",
              }}
            >
              🌱 다음 기억으로 →
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
