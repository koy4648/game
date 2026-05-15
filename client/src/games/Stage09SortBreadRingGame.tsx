/*
 * Stage 9 - 대전 1주년: 딸기요거롤/반지 컨베이어 분류 게임
 * 위에서 아래로 계속 흐르는 아이템 중 가장 앞에 있는 것을 좌우 키로 분류한다.
 *
 * 디자인: 성심당 베이커리 톤앤매너
 *   - 따뜻한 크림/베이지/딸기핑크/골드 팔레트
 *   - 귀여운 베이커리 소품 이모지 장식
 *   - 컨베이어 벨트: 따뜻한 우드 톤
 *   - 아이템 카드: 파스텔 크림 + 핑크/골드 테두리
 *   - 피드백: 하트·별·빵 파티클 효과
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

// ── 성심당 아이템 설정 ────────────────────────────────────────────────────────
const ITEM_EMOJI: Record<ItemType, string> = {
  strawberryRoll: "🍓",   // 딸기요거롤 → 딸기 강조
  ring: "💍",
};

// 아이템 카드 장식 이모지 (배경에 작게)
const ITEM_DECO: Record<ItemType, string> = {
  strawberryRoll: "🥐",
  ring: "✨",
};

const ITEM_LABEL: Record<ItemType, string> = {
  strawberryRoll: "딸기요거롤",
  ring: "반지",
};

// 정답 피드백 이모지 풀
const GOOD_FEEDBACKS = ["🍓 +1!", "✨ 굿!", "💕 정답!", "🥐 완벽!", "⭐ +1!", "🎀 +1!"];
const BAD_FEEDBACKS  = ["💦 앗!", "😅 반대!", "🙈 아이쿠!", "💨 틀렸어!"];

const TARGET_SCORE       = 20;
const PENALTY            = 5;
const SPAWN_INTERVAL_MS  = 400;
const ITEM_SPEED_PER_SECOND = 50;

function createItem(id: number, y = -16): ConveyorItem {
  return {
    id,
    type: Math.random() > 0.5 ? "strawberryRoll" : "ring",
    x: 42 + Math.random() * 16,
    y,
  };
}

// ── 성심당 팔레트 ─────────────────────────────────────────────────────────────
const C = {
  cream:    "#fff8f0",      // 크림 배경
  creamD:   "#fdf0e0",      // 진한 크림
  pink:     "#f48fb1",      // 딸기 핑크
  pinkL:    "#fce4ec",      // 연한 핑크
  pinkD:    "#e91e63",      // 진한 핑크
  gold:     "#f9a825",      // 골드
  goldL:    "#fff9c4",      // 연한 골드
  goldD:    "#e65100",      // 진한 골드
  brown:    "#8d6e63",      // 우드 브라운
  brownL:   "#d7ccc8",      // 연한 브라운
  brownD:   "#4e342e",      // 진한 브라운
  strawberry:"#e53935",     // 딸기 빨강
  mint:     "#80cbc4",      // 민트
  lavender: "#ce93d8",      // 라벤더
  text:     "#4e342e",      // 본문 텍스트
  textL:    "#8d6e63",      // 연한 텍스트
  white:    "#ffffff",
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
  const [message,    setMessage]    = useState("벨트 위 아이템을 분류해줘!");
  const [wrongFlash, setWrongFlash] = useState(false);
  const [feedbacks,  setFeedbacks]  = useState<Feedback[]>([]);

  const progress = Math.min(100, Math.round((score / TARGET_SCORE) * 100));

  const addFeedback = useCallback((text: string, isGood: boolean) => {
    const id = feedbackIdRef.current++;
    setFeedbacks((cur) => [...cur, { id, text, isGood }]);
    window.setTimeout(() => {
      setFeedbacks((cur) => cur.filter((f) => f.id !== id));
    }, 820);
  }, []);

  const spawnItem = useCallback((y = -16) => {
    setItems((cur) => {
      const next = [...cur, createItem(nextIdRef.current++, y)];
      itemsRef.current = next;
      return next;
    });
  }, []);

  const beginGame = () => {
    nextIdRef.current      = 0;
    lastFrameTimeRef.current = null;
    const init = [createItem(nextIdRef.current++, -6), createItem(nextIdRef.current++, -38)];
    setScore(0);
    itemsRef.current = init;
    setItems(init);
    setMessage("🍓 딸기요거롤은 왼쪽, 💍 반지는 오른쪽!");
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
          if (ns >= TARGET_SCORE) window.setTimeout(() => setCleared(true), 260);
          return ns;
        });
        const fb = GOOD_FEEDBACKS[Math.floor(Math.random() * GOOD_FEEDBACKS.length)];
        setMessage(`${ITEM_LABEL[front.type]} 완벽해! 🎀`);
        addFeedback(fb, true);
      } else {
        setScore((s) => Math.max(0, s - PENALTY));
        const fb = BAD_FEEDBACKS[Math.floor(Math.random() * BAD_FEEDBACKS.length)];
        setMessage(`반대쪽이야! -${PENALTY}점 💦`);
        addFeedback(fb, false);
        setWrongFlash(true);
        window.setTimeout(() => setWrongFlash(false), 280);
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

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={TARGET_SCORE}
      hintText="🍓 딸기요거롤은 왼쪽 / 💍 반지는 오른쪽! 가장 아래쪽 아이템부터 분류해요"
      onRetry={resetGame}
    >
      <style>{`
        @keyframes s9-belt {
          from { background-position-y: 0; }
          to   { background-position-y: 64px; }
        }
        @keyframes s9-item-in {
          0%   { transform: translate(-50%,-50%) scale(0.6) rotate(-8deg); opacity:0; }
          70%  { transform: translate(-50%,-50%) scale(1.08) rotate(2deg); opacity:1; }
          100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes s9-feedback-up {
          0%   { transform: translateX(-50%) translateY(0)   scale(1);    opacity:1; }
          100% { transform: translateX(-50%) translateY(-36px) scale(1.2); opacity:0; }
        }
        @keyframes s9-btn-bounce {
          0%,100% { transform: scale(1); }
          40%     { transform: scale(0.93); }
          70%     { transform: scale(1.04); }
        }
        @keyframes s9-sparkle {
          0%,100% { opacity:1; transform:scale(1) rotate(0deg); }
          50%     { opacity:0.6; transform:scale(1.3) rotate(15deg); }
        }
        @keyframes s9-float {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%     { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes s9-wrong-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        .s9-item-card { animation: s9-item-in 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .s9-feedback  { animation: s9-feedback-up 0.82s ease-out forwards; }
        .s9-btn-press:active { animation: s9-btn-bounce 0.2s ease; }
        .s9-deco-float { animation: s9-float 2.8s ease-in-out infinite; }
      `}</style>

      {/* ── 시작 화면 ── */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            className="card-glow p-7 text-center max-w-sm w-full"
            style={{
              background: `linear-gradient(145deg, ${C.cream} 0%, ${C.pinkL} 100%)`,
              border: `2px solid ${C.pink}55`,
              boxShadow: `0 8px 32px ${C.pink}22, 0 2px 0 ${C.white} inset`,
            }}
          >
            {/* 장식 이모지 행 */}
            <div style={{ fontSize: "1.5rem", letterSpacing: "0.3em", marginBottom: 6, animation: "s9-sparkle 2s ease-in-out infinite" }}>
              🥐 🍓 💍 🎀 🥐
            </div>

            <h2
              className="text-xl font-bold mb-1"
              style={{ color: C.brownD, fontFamily: "'Gowun Dodum', sans-serif" }}
            >
              성심당 컨베이어 🍞
            </h2>
            <p style={{ fontSize: "0.72rem", color: C.pink, fontFamily: "'Gowun Dodum', sans-serif", marginBottom: 12, fontWeight: "bold" }}>
              대전 1주년 기념 데이트 ✨
            </p>

            {/* 분류 안내 카드 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{
                flex: 1, padding: "10px 8px", borderRadius: 14,
                background: C.pinkL, border: `2px solid ${C.pink}66`,
                fontFamily: "'Gowun Dodum', sans-serif",
              }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>🍓</div>
                <div style={{ fontSize: "0.62rem", fontWeight: "bold", color: C.pinkD }}>딸기요거롤</div>
                <div style={{ fontSize: "0.58rem", color: C.pink, marginTop: 2 }}>← 왼쪽</div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", color: C.brownL,
              }}>VS</div>
              <div style={{
                flex: 1, padding: "10px 8px", borderRadius: 14,
                background: C.goldL, border: `2px solid ${C.gold}66`,
                fontFamily: "'Gowun Dodum', sans-serif",
              }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>💍</div>
                <div style={{ fontSize: "0.62rem", fontWeight: "bold", color: C.goldD }}>반지</div>
                <div style={{ fontSize: "0.58rem", color: C.gold, marginTop: 2 }}>오른쪽 →</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: C.textL, fontFamily: "'Gowun Dodum', sans-serif" }}>
              컨베이어에서 내려오는 아이템을<br />
              빠르게 분류해봐요! 🎀
            </p>
            <button
              className="btn-star s9-btn-press"
              onClick={beginGame}
              style={{ width: "100%", background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})` }}
            >
              🍓 시작하기
            </button>
          </div>
        </div>
      )}

      {/* ── 게임 플레이 ── */}
      {started && !cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-5 w-full">
          <div
            className="w-full max-w-3xl"
            style={{
              animation: wrongFlash ? "s9-wrong-shake 0.28s ease" : "none",
            }}
          >
            {/* 메시지 */}
            <div
              className="mb-3 text-center font-bold"
              style={{
                minHeight: 28,
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.92rem",
                color: message.includes("-") || message.includes("반대") ? C.strawberry : C.brownD,
                textShadow: "0 1px 4px rgba(0,0,0,0.12)",
                transition: "color 0.2s ease",
              }}
            >
              {message}
            </div>

            {/* 프로그레스 바 */}
            <div
              style={{
                marginBottom: 14,
                borderRadius: 16,
                border: `1.5px solid ${C.brownL}`,
                background: C.cream,
                padding: "8px 12px",
                boxShadow: `0 2px 8px ${C.pink}18`,
              }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.72rem",
                  color: C.brownD,
                  fontWeight: "bold",
                }}
              >
                <span>🍓 {score} / {TARGET_SCORE}개 분류 완료</span>
                <span style={{ color: C.pink }}>{progress}%</span>
              </div>
              <div
                style={{
                  height: 10, borderRadius: 999,
                  background: C.brownL + "55",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    height: "100%", borderRadius: 999,
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${C.pink}, ${C.gold})`,
                    transition: "width 200ms ease",
                    boxShadow: `0 0 8px ${C.pink}88`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* 반짝이 줄무늬 */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "repeating-linear-gradient(90deg, transparent 0 12px, rgba(255,255,255,0.25) 12px 16px)",
                  }} />
                </div>
              </div>
            </div>

            {/* 컨베이어 필드 */}
            <div
              style={{
                position: "relative",
                height: "clamp(340px, 52vh, 520px)",
                borderRadius: 22,
                border: `2.5px solid ${C.brownL}`,
                overflow: "hidden",
                boxShadow: `0 12px 36px ${C.brown}28, 0 2px 0 ${C.white} inset`,
                // 성심당 베이커리 따뜻한 배경
                background: `
                  radial-gradient(ellipse at 20% 10%, ${C.pinkL}88 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 15%, ${C.goldL}66 0%, transparent 45%),
                  linear-gradient(180deg, ${C.creamD} 0%, ${C.cream} 40%, ${C.creamD} 100%)
                `,
              }}
            >
              {/* 배경 장식 이모지들 (고정, 흐릿하게) */}
              {[
                { emoji: "🥐", x: "8%",  y: "8%",  size: "1.8rem", delay: "0s" },
                { emoji: "🍰", x: "82%", y: "6%",  size: "1.6rem", delay: "0.5s" },
                { emoji: "☕", x: "5%",  y: "45%", size: "1.4rem", delay: "1s" },
                { emoji: "🎂", x: "85%", y: "42%", size: "1.5rem", delay: "0.8s" },
                { emoji: "🌸", x: "10%", y: "78%", size: "1.3rem", delay: "0.3s" },
                { emoji: "✨", x: "80%", y: "75%", size: "1.2rem", delay: "1.2s" },
              ].map((d, i) => (
                <div
                  key={i}
                  className="s9-deco-float"
                  style={{
                    position: "absolute",
                    left: d.x, top: d.y,
                    fontSize: d.size,
                    opacity: 0.18,
                    pointerEvents: "none",
                    animationDelay: d.delay,
                    userSelect: "none",
                  }}
                >
                  {d.emoji}
                </div>
              ))}

              {/* 컨베이어 벨트 (우드 톤) */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%", top: 0, bottom: 0,
                  width: "min(50vw, 280px)",
                  transform: "translateX(-50%)",
                  background: `repeating-linear-gradient(
                    180deg,
                    ${C.brown}cc 0 28px,
                    ${C.brownD}cc 28px 56px
                  )`,
                  borderLeft:  `4px solid ${C.brownD}`,
                  borderRight: `4px solid ${C.brownD}`,
                  boxShadow: `
                    inset 10px 0 16px rgba(255,255,255,0.08),
                    inset -10px 0 16px rgba(0,0,0,0.18),
                    4px 0 12px ${C.brown}44,
                    -4px 0 12px ${C.brown}44
                  `,
                  animation: "s9-belt 0.7s linear infinite",
                }}
              />
              {/* 벨트 중앙 하이라이트 줄 */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%", top: 0, bottom: 0,
                  width: 3,
                  transform: "translateX(-50%)",
                  background: `linear-gradient(180deg, transparent, ${C.brownL}66, transparent)`,
                  pointerEvents: "none",
                }}
              />

              {/* 왼쪽 분류함 - 딸기요거롤 */}
              <div
                style={{
                  position: "absolute",
                  left: 14, bottom: 16,
                  width: "clamp(72px, 17vw, 112px)",
                  height: "clamp(76px, 16vh, 124px)",
                  borderRadius: 18,
                  border: `2.5px dashed ${C.pink}99`,
                  background: `linear-gradient(145deg, ${C.pinkL}cc, ${C.cream}cc)`,
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  boxShadow: `0 4px 16px ${C.pink}22`,
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>🍓</span>
                <span style={{
                  fontSize: "0.62rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  color: C.pinkD,
                  fontWeight: "bold",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}>
                  A / ←<br />딸기요거롤
                </span>
              </div>

              {/* 오른쪽 분류함 - 반지 */}
              <div
                style={{
                  position: "absolute",
                  right: 14, bottom: 16,
                  width: "clamp(72px, 17vw, 112px)",
                  height: "clamp(76px, 16vh, 124px)",
                  borderRadius: 18,
                  border: `2.5px dashed ${C.gold}99`,
                  background: `linear-gradient(145deg, ${C.goldL}cc, ${C.cream}cc)`,
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  boxShadow: `0 4px 16px ${C.gold}22`,
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>💍</span>
                <span style={{
                  fontSize: "0.62rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  color: C.goldD,
                  fontWeight: "bold",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}>
                  D / →<br />반지
                </span>
              </div>

              {/* 아이템 카드들 */}
              {items.map((item) => {
                const isStrawberry = item.type === "strawberryRoll";
                return (
                  <div
                    key={item.id}
                    className="s9-item-card"
                    style={{
                      position: "absolute",
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: "clamp(56px, 11vw, 86px)",
                      aspectRatio: "1 / 1",
                      transform: "translate(-50%, -50%)",
                      borderRadius: 18,
                      background: isStrawberry
                        ? `linear-gradient(145deg, ${C.pinkL}, ${C.cream})`
                        : `linear-gradient(145deg, ${C.goldL}, ${C.cream})`,
                      border: `2.5px solid ${isStrawberry ? C.pink : C.gold}`,
                      boxShadow: `
                        0 6px 20px ${isStrawberry ? C.pink : C.gold}44,
                        0 2px 0 ${C.white} inset
                      `,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      zIndex: Math.round(item.y),
                    }}
                    aria-label={ITEM_LABEL[item.type]}
                  >
                    <span style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)", lineHeight: 1 }}>
                      {ITEM_EMOJI[item.type]}
                    </span>
                    <span style={{
                      fontSize: "clamp(0.38rem, 1.2vw, 0.55rem)",
                      color: isStrawberry ? C.pinkD : C.goldD,
                      fontFamily: "'Gowun Dodum', sans-serif",
                      fontWeight: "bold",
                      letterSpacing: "-0.01em",
                    }}>
                      {ITEM_DECO[item.type]}
                    </span>
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
                    top: `${14 + idx * 11}%`,
                    transform: "translateX(-50%)",
                    color: fb.isGood ? C.pinkD : C.strawberry,
                    fontSize: "clamp(1.1rem, 4vw, 1.8rem)",
                    fontWeight: 900,
                    fontFamily: "'Gowun Dodum', sans-serif",
                    textShadow: `0 2px 10px ${fb.isGood ? C.pink : C.strawberry}66`,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.02em",
                  }}
                >
                  {fb.text}
                </div>
              ))}
            </div>

            {/* 조작 버튼 */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                className="s9-btn-press"
                onClick={() => handleSort("left")}
                style={{
                  background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`,
                  color: C.white,
                  border: "none",
                  borderRadius: 999,
                  padding: "0.85rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  boxShadow: `0 4px 16px ${C.pink}55, 0 2px 0 ${C.white}44 inset`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
              >
                <span>←</span>
                <span>🍓 딸기요거롤</span>
              </button>
              <button
                className="s9-btn-press"
                onClick={() => handleSort("right")}
                style={{
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldD})`,
                  color: C.white,
                  border: "none",
                  borderRadius: 999,
                  padding: "0.85rem 1rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  boxShadow: `0 4px 16px ${C.gold}55, 0 2px 0 ${C.white}44 inset`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
              >
                <span>💍 반지</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 클리어 화면 ── */}
      {cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            className="card-glow p-8 text-center max-w-sm w-full animate-bounce-in"
            style={{
              background: `linear-gradient(145deg, ${C.cream} 0%, ${C.pinkL} 50%, ${C.goldL} 100%)`,
              border: `2px solid ${C.pink}55`,
              boxShadow: `0 12px 40px ${C.pink}33, 0 2px 0 ${C.white} inset`,
            }}
          >
            {/* 축하 이모지 행 */}
            <div style={{ fontSize: "2rem", letterSpacing: "0.2em", marginBottom: 8 }}>
              🎉🍓💍🎀🎉
            </div>

            <h2
              className="text-xl font-bold mb-2"
              style={{ color: C.brownD, fontFamily: "'Gowun Dodum', sans-serif" }}
            >
              1주년 데이트 완료! 🥂
            </h2>

            <p
              style={{
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.82rem",
                color: C.textL,
                lineHeight: 1.8,
                marginBottom: 6,
              }}
            >
              반지도 만들고<br />
              딸기요거롤도 챙겼다 🍓
            </p>

            <p
              style={{
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.72rem",
                color: C.pink,
                marginBottom: 20,
                fontWeight: "bold",
              }}
            >
              ✨ 성심당에서의 달콤한 하루 ✨
            </p>

            {/* 장식 구분선 */}
            <div style={{
              height: 2,
              background: `repeating-linear-gradient(90deg, ${C.pink} 0 8px, ${C.gold} 8px 16px, ${C.pinkL} 16px 24px)`,
              borderRadius: 999,
              marginBottom: 20,
            }} />

            <button
              className="btn-star s9-btn-press"
              onClick={onComplete}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`,
              }}
            >
              다음 기억으로 →
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
