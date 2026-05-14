/*
 * Stage 10 - 벚꽃스냅: 같은 사진 위치 맞추기 메모리 게임
 */
import { useState, useEffect } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type CardType = {
  id: number;
  imgIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
};

const NUM_PAIRS = 6;
const TARGET_SCORE = NUM_PAIRS;

// 카드 섞기 (Fisher-Yates)
function shuffleCards(): CardType[] {
  const images = Array.from({ length: NUM_PAIRS }, (_, i) => i + 1);
  const deck = [...images, ...images].map((imgIndex, i) => ({
    id: i,
    imgIndex,
    isFlipped: false,
    isMatched: false,
  }));

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function Stage10SamePhotoMatchGame({ stage, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(3);

  // 게임 시작 시 카드 섞고 미리보기 보여주기
  useEffect(() => {
    if (started) {
      // 처음에는 모든 카드가 뒤집혀 있는(isFlipped: true) 상태로 세팅
      const initialCards = shuffleCards().map(c => ({ ...c, isFlipped: true }));
      setCards(initialCards);
      setMatchedPairs(0);
      setFlippedCards([]);
      setHintsLeft(3);
      setIsLocked(true); // 미리보기 중 클릭 방지
      setCleared(false);
      setIsPreviewing(true);

      // 3초 후 카드를 모두 다시 덮고 게임 시작
      const timer = setTimeout(() => {
        setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
        setIsLocked(false);
        setIsPreviewing(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [started]);

  const handleHint = () => {
    // 진행 중이 아니거나 힌트를 이미 다 썼거나 등등 예외 처리
    if (isLocked || isPreviewing || cleared || flippedCards.length > 0 || hintsLeft <= 0) return;
    
    setHintsLeft(prev => prev - 1);
    setIsLocked(true);
    setIsPreviewing(true);

    // 맞춰지지 않은 카드 전부 일시적으로 뒤집기
    setCards(prev => prev.map(c => c.isMatched ? c : { ...c, isFlipped: true }));

    // 1.5초 후 원상복구
    setTimeout(() => {
      setCards(prev => prev.map(c => c.isMatched ? c : { ...c, isFlipped: false }));
      setIsLocked(false);
      setIsPreviewing(false);
    }, 1500);
  };

  const handleCardClick = (index: number) => {
    // 예외 처리: 진행 중이 아님, 잠금 상태, 이미 짝맞춤, 이미 뒤집힘
    if (!started || cleared || isLocked) return;
    const card = cards[index];
    if (card.isMatched || card.isFlipped) return;

    // 현재 카드 뒤집기
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    // 두 장을 뒤집었을 때 판별 로직
    if (newFlipped.length === 2) {
      setIsLocked(true); // 추가 클릭 방지
      const [idx1, idx2] = newFlipped;

      if (newCards[idx1].imgIndex === newCards[idx2].imgIndex) {
        // 일치할 경우
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[idx1] = { ...next[idx1], isMatched: true };
            next[idx2] = { ...next[idx2], isMatched: true };
            return next;
          });
          setMatchedPairs((prev) => {
            const nextVal = prev + 1;
            if (nextVal === TARGET_SCORE) {
              setTimeout(() => setCleared(true), 500);
            }
            return nextVal;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 400); // 살짝 딜레이 후 매칭 처리
      } else {
        // 불일치할 경우 1초 대기 후 원상복구
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[idx1] = { ...next[idx1], isFlipped: false };
            next[idx2] = { ...next[idx2], isFlipped: false };
            return next;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <GameLayout
      stage={stage}
      score={matchedPairs}
      maxScore={TARGET_SCORE}
      hintText="같은 사진 두 장을 찾아 짝을 맞춰보세요! (총 6쌍)"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full relative">

        {/* ── 시작 화면 ── */}
        {!started && (
          <div
            style={{
              background: "oklch(0.13 0.04 280 / 0.88)",
              border: "1.5px solid oklch(0.78 0.14 55 / 0.45)",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 8 }}>🌸📸</div>
            <h2
              style={{
                color: "oklch(0.88 0.12 55)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "1.3rem",
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Stage 10. 벚꽃스냅
            </h2>
            <p
              style={{
                color: "oklch(0.85 0.05 60)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              우리의 예쁜 순간들이 담긴 사진들입니다.<br />
              <strong style={{ color: "oklch(0.88 0.14 55)" }}>같은 사진을 맞춰주세요!</strong>
            </p>
            <button
              className="btn-star"
              onClick={() => setStarted(true)}
              style={{ width: "100%" }}
            >
              기억 찾기 시작
            </button>
          </div>
        )}

        {/* ── 게임 화면 ── */}
        {started && !cleared && (
          <div className="w-full flex flex-col items-center max-w-sm mx-auto">
            <div className="flex justify-between items-center w-full mb-5 px-2">
              <h3
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "1.05rem",
                  color: isPreviewing ? "oklch(0.6 0.1 280)" : "oklch(0.85 0.12 350)",
                  fontWeight: "bold",
                  animation: isPreviewing ? "pulse 1.5s infinite" : "none",
                }}
              >
                {isPreviewing 
                  ? "사진 위치를 기억하세요! 👀" 
                  : `같은 사진 맞추기 (${matchedPairs}/${TARGET_SCORE})`}
              </h3>
              
              <button
                onClick={handleHint}
                disabled={isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.85rem",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: "bold",
                  background: (isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0) 
                    ? "oklch(0.2 0.04 280 / 0.5)" 
                    : "oklch(0.25 0.08 55)",
                  color: (isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0) 
                    ? "oklch(0.5 0.04 280)" 
                    : "oklch(0.95 0.1 55)",
                  border: `1px solid ${(isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0) ? "oklch(0.3 0.04 280 / 0.4)" : "oklch(0.8 0.1 55 / 0.6)"}`,
                  cursor: (isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: (isLocked || isPreviewing || flippedCards.length > 0 || hintsLeft <= 0) ? "none" : "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                💡 힌트 ({hintsLeft})
              </button>
            </div>

            {/* 카드 3x4 그리드 */}
            <div
              className="grid grid-cols-3 gap-3 w-full"
              style={{ perspective: "1000px" }}
            >
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className="relative aspect-[3/4] cursor-pointer"
                  onClick={() => handleCardClick(index)}
                  style={{
                    transform: "scale(1)",
                    transition: "transform 0.15s",
                  }}
                  onMouseDown={(e) => !isLocked && !card.isMatched && !card.isFlipped && (e.currentTarget.style.transform = "scale(0.95)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onTouchStart={(e) => !isLocked && !card.isMatched && !card.isFlipped && (e.currentTarget.style.transform = "scale(0.95)")}
                  onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div
                    className="w-full h-full transition-transform duration-500 ease-out"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* 뒷면 (게임 시작 전 보이는 면, rotateY 0) */}
                    <div
                      className="absolute inset-0 rounded-xl flex items-center justify-center"
                      style={{
                        backfaceVisibility: "hidden",
                        background: "linear-gradient(135deg, oklch(0.25 0.08 350) 0%, oklch(0.18 0.05 350) 100%)",
                        border: "2px solid oklch(0.78 0.14 55 / 0.6)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div style={{ fontSize: "2rem", opacity: 0.9 }}>🌸</div>
                    </div>

                    {/* 앞면 (사진이 보이는 면, rotateY 180) */}
                    <div
                      className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        border: card.isMatched
                          ? "3px solid oklch(0.72 0.18 140)"
                          : "2px solid oklch(0.85 0.05 280)",
                        boxShadow: card.isMatched
                          ? "0 0 20px oklch(0.72 0.18 140 / 0.5)"
                          : "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                    >
                      <img
                        src={`/webdev-static-assets/caricature-snap${card.imgIndex}.png`}
                        alt={`Snap ${card.imgIndex}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 이미지가 없을 때의 Fallback
                          e.currentTarget.style.display = "none";
                          const fallback = document.createElement("div");
                          fallback.className = "flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-800";
                          fallback.innerHTML = `<span style="font-size: 1.5rem">📸</span><span style="font-size: 0.8rem; font-weight: bold; margin-top: 4px;">사진 ${card.imgIndex}</span>`;
                          e.currentTarget.parentElement?.appendChild(fallback);
                        }}
                      />
                      {/* 매칭 완료 시 오버레이 반짝임 효과 */}
                      {card.isMatched && (
                        <div
                          className="absolute inset-0 bg-white/20 flex items-center justify-center"
                          style={{ animation: "popIn 0.4s ease-out" }}
                        >
                          <span style={{ fontSize: "3rem", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))" }}>✨</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 클리어 화면 ── */}
        {cleared && (
          <div
            style={{
              background: "oklch(0.13 0.04 280 / 0.92)",
              border: "2px solid oklch(0.78 0.14 55 / 0.6)",
              borderRadius: 24,
              padding: "36px 28px",
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 40px oklch(0.78 0.14 55 / 0.2)",
              animation: "popIn 0.4s ease-out",
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🌸👩‍❤️‍👨🌸</div>
            <h2
              style={{
                color: "oklch(0.88 0.12 55)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              완벽해요!<br />우리의 예쁜 순간들이<br />모두 맞춰졌습니다 🌸
            </h2>
            <button
              className="btn-star"
              onClick={onComplete}
              style={{ width: "100%", fontSize: "1rem" }}
            >
              다음 기억으로 →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </GameLayout>
  );
}
