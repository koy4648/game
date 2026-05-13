import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { StageInfo } from "@/contexts/GameContext";
import GuideBear from "@/components/GuideBear";

const BITE_IMG = "/webdev-static-assets/caricature-bite.png";

interface GameLayoutProps {
  stage: StageInfo;
  children: React.ReactNode;
  score?: number;
  maxScore?: number;
  timeLeft?: number;
  onHint?: () => void;
  hintText?: string;
  showProgress?: boolean;
  showBite?: boolean; // 실패 시 깨물 리액션 트리거
  onBiteEnd?: () => void;
  onRetry?: () => void; // 다시 도전하기 콜백
}

export default function GameLayout({
  stage,
  children,
  score,
  maxScore,
  timeLeft,
  onHint,
  hintText,
  showProgress = true,
  showBite = false,
  onBiteEnd,
  onRetry,
}: GameLayoutProps) {
  const [, navigate] = useLocation();
  const [showHint, setShowHint] = useState(false);
  const [biteVisible, setBiteVisible] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const prevBiteRef = useRef(false);

  // showBite가 false→true로 바뀔 때 깨물 이미지 표시
  useEffect(() => {
    if (showBite && !prevBiteRef.current) {
      setBiteVisible(true);
      setShowRetry(false);
      // 1.2초 후 깨물 이미지 사라지고 다시 도전 버튼 표시
      const t1 = setTimeout(() => {
        setBiteVisible(false);
        setShowRetry(true);
        onBiteEnd?.();
      }, 1200);
      return () => clearTimeout(t1);
    }
    if (!showBite) {
      setShowRetry(false);
    }
    prevBiteRef.current = showBite;
  }, [showBite, onBiteEnd]);

  const handleHint = () => {
    setShowHint(true);
    onHint?.();
    setTimeout(() => setShowHint(false), 4000);
  };

  const handleRetry = () => {
    setShowRetry(false);
    onRetry?.();
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ zIndex: 1 }}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: stage.bg
            ? `url(${stage.bg}) center/cover no-repeat`
            : "oklch(0.13 0.04 280)",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom, oklch(0.08 0.04 280 / 0.55), oklch(0.08 0.04 280 / 0.35))",
        }}
      />
      {/* 전구 줄 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center gap-6 pt-1 px-4 pointer-events-none">
        {["🟡","🔴","🟢","🔵","🟡","🔴","🟢","🔵","🟡","🔴","🟢","🔵"].map((c, i) => (
          <span key={i} className="text-base" style={{ animation: `twinkle ${1.2 + (i % 4) * 0.3}s ease-in-out infinite alternate` }}>{c}</span>
        ))}
      </div>
      {/* 상단 헤더 */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate("/map")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "oklch(0.13 0.04 280 / 0.7)", color: "oklch(0.90 0.05 60)", border: "1px solid oklch(1 0 0 / 20%)" }}
        >
          ← 지도로
        </button>
        <div className="flex items-center gap-3">
          {timeLeft !== undefined && (
            <div
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: timeLeft <= 10 ? "oklch(0.577 0.245 27 / 0.8)" : "oklch(0.13 0.04 280 / 0.7)",
                color: timeLeft <= 10 ? "white" : "oklch(0.90 0.05 60)",
                border: "1px solid oklch(1 0 0 / 20%)",
              }}
            >
              ⏱ {timeLeft}초
            </div>
          )}
          {score !== undefined && (
            <div
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: "oklch(0.13 0.04 280 / 0.7)", color: "oklch(0.78 0.14 55)", border: "1px solid oklch(1 0 0 / 20%)" }}
            >
              ⭐ {score}{maxScore ? `/${maxScore}` : ""}
            </div>
          )}
        </div>
      </div>
      {/* 스테이지 제목 */}
      <div className="relative z-10 text-center px-4 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: "oklch(0.13 0.04 280 / 0.75)", border: "1px solid oklch(0.78 0.14 55 / 0.4)" }}>
          <span className="text-lg">{stage.emoji}</span>
          <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
            {stage.name}
          </span>
          <span className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>{stage.date}</span>
        </div>
      </div>
      {/* 힌트 */}
      {showHint && hintText && (
        <div className="relative z-10 px-4 mb-2">
          <GuideBear message={hintText} hintMode onClose={() => setShowHint(false)} />
        </div>
      )}
      {/* 게임 영역 */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
      {/* 캐리커처 이미지 - 좌측 하단 */}
      {stage.caricature && (
        <div
          className="fixed bottom-0 left-0 z-20 pointer-events-none"
          style={{
            width: "clamp(100px, 22vw, 170px)",
            opacity: (biteVisible || showRetry) ? 0 : 1,
            pointerEvents: "none",
            transition: "opacity 0.2s",
          }}
        >
          <img
            src={stage.caricature}
            alt="캐리커처"
            className="w-full h-auto object-contain"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
          />
        </div>
      )}
      {/* 깨물 리액션 오버레이 */}
      {biteVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0.05 0.02 280 / 0.7)", pointerEvents: "none" }}
        >
          <div
            style={{
              animation: "biteIn 0.3s ease-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <img
              src={BITE_IMG}
              alt="깨물!"
              style={{
                width: "clamp(180px, 45vw, 300px)",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 30px rgba(255,60,60,0.8))",
              }}
            />
            <div
              style={{
                background: "oklch(0.25 0.08 20 / 0.95)",
                border: "2px solid oklch(0.65 0.22 20)",
                borderRadius: "999px",
                padding: "8px 24px",
                color: "oklch(0.95 0.05 60)",
                fontSize: "1rem",
                fontWeight: "bold",
                fontFamily: "'Gowun Dodum', sans-serif",
              }}
            >
              깨물어버릴 거야! 😤
            </div>
          </div>
        </div>
      )}
      {/* 다시 도전하기 오버레이 */}
      {showRetry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0.05 0.02 280 / 0.75)" }}
        >
          <div
            style={{
              animation: "biteIn 0.3s ease-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              background: "oklch(0.15 0.05 280 / 0.95)",
              border: "2px solid oklch(0.72 0.12 350 / 0.6)",
              borderRadius: "24px",
              padding: "32px 40px",
              boxShadow: "0 0 40px oklch(0.72 0.12 350 / 0.3)",
            }}
          >
            <img
              src={BITE_IMG}
              alt="깨물!"
              style={{
                width: "clamp(120px, 30vw, 200px)",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 20px rgba(255,60,60,0.6))",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "oklch(0.95 0.05 60)", fontSize: "1.1rem", fontWeight: "bold", fontFamily: "'Gowun Dodum', sans-serif", marginBottom: "4px" }}>
                아쉽다... 😢
              </div>
              <div style={{ color: "oklch(0.75 0.05 280)", fontSize: "0.85rem", fontFamily: "'Gowun Dodum', sans-serif" }}>
                다시 도전해봐! 할 수 있어! 💪
              </div>
            </div>
            {onRetry && (
              <button
                onClick={handleRetry}
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.12 350), oklch(0.65 0.18 20))",
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px 32px",
                  color: "white",
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px oklch(0.72 0.12 350 / 0.4)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                🔄 다시 도전하기
              </button>
            )}
          </div>
        </div>
      )}
      {/* 망곰이 힌트 버튼 */}
      {hintText && (
        <button
          onClick={handleHint}
          className="fixed bottom-6 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105"
          style={{ background: "oklch(0.18 0.05 275 / 0.9)", border: "1px solid oklch(0.72 0.12 350 / 0.6)", color: "oklch(0.90 0.05 350)" }}
        >
          <img src="/webdev-static-assets/guide-bear.png" alt="망곰이" className="w-8 h-8 object-contain" />
          도와줘!
        </button>
      )}
      <style>{`
        @keyframes biteIn {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes twinkle {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
