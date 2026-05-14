/*
 * Home.tsx — 인트로 페이지
 * 디자인: 네이비 밤하늘 + 전구 조명 + 카와이 일러스트 + 골드 포인트
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const COUPLE_IMG = "/webdev-static-assets/caricature-selfsnap_nobg.png";
// const COUPLE_IMG = "/webdev-static-assets/character-couple-v5.png";
const MAP_PREVIEW = "/webdev-static-assets/travel-map-v4.png";

// 별 위치 고정 (랜덤 방지)
const STARS = Array.from({ length: 30 }, (_, i) => ({
  left: ((i * 37 + 13) % 100),
  top: ((i * 53 + 7) % 100),
  size: 5 + (i % 5) * 2,
  delay: (i * 0.3) % 3,
  dur: 1.5 + (i % 4) * 0.5,
}));

// 전구 장식 (상단)
const BULBS = Array.from({ length: 12 }, (_, i) => ({
  left: (i / 11) * 100,
  color: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFB6C1" : "#FFF8DC",
}));

export default function Home() {
  const [, navigate] = useLocation();
  const [clicked, setClicked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    setClicked(true);
    setTimeout(() => navigate("/map"), 700);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(180deg, oklch(0.10 0.06 285) 0%, oklch(0.14 0.08 270) 50%, oklch(0.10 0.06 285) 100%)",
      }}
    >
      {/* 골드 테두리 */}
      <div
        className="fixed inset-2 pointer-events-none"
        style={{
          border: "2px solid oklch(0.78 0.14 55 / 0.35)",
          borderRadius: "16px",
          boxShadow: "inset 0 0 40px oklch(0.78 0.14 55 / 0.05)",
          zIndex: 50,
        }}
      />
      {/* 모서리 장식 */}
      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
        <div
          key={i}
          className={`fixed ${pos} pointer-events-none`}
          style={{
            width: 24, height: 24,
            border: "2px solid oklch(0.78 0.14 55 / 0.6)",
            borderRadius: i < 2 ? (i === 0 ? "8px 0 0 0" : "0 8px 0 0") : (i === 2 ? "0 0 0 8px" : "0 0 8px 0"),
            zIndex: 51,
          }}
        />
      ))}

      {/* 별 배경 */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="fixed pointer-events-none animate-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            color: "oklch(0.95 0.05 60)",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            opacity: 0.5,
            zIndex: 1,
          }}
        >
          ✦
        </div>
      ))}

      {/* 전구 줄 (상단) */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* 전구 줄 선 */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "5%",
            right: "5%",
            height: 2,
            background: "oklch(0.78 0.14 55 / 0.4)",
          }}
        />
        {BULBS.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${5 + b.left * 0.9}%`,
              top: 10,
              width: 14,
              height: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* 전구 몸통 */}
            <div
              style={{
                width: 10,
                height: 14,
                borderRadius: "50% 50% 40% 40%",
                background: b.color,
                boxShadow: `0 0 8px ${b.color}, 0 0 16px ${b.color}60`,
                animation: `twinkle ${1.5 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div
        className="relative flex flex-col items-center gap-5 text-center px-6 pt-10"
        style={{ zIndex: 10, maxWidth: 380 }}
      >
        {/* 제목 배너 */}
        <div
          className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          style={{ transitionDelay: "0.1s" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, oklch(0.78 0.14 55 / 0.15), oklch(0.72 0.12 350 / 0.15))",
              border: "1px solid oklch(0.78 0.14 55 / 0.5)",
              borderRadius: 999,
              padding: "6px 20px",
              marginBottom: 8,
              display: "inline-block",
            }}
          >
            <span style={{ color: "oklch(0.78 0.14 55)", fontSize: "0.75rem", fontFamily: "'Gowun Dodum', sans-serif", letterSpacing: "0.1em" }}>
              ✦ 행복했던 시간들 톺아보기 ✦
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "clamp(1.8rem, 7vw, 2.4rem)",
              fontWeight: 700,
              color: "oklch(0.95 0.02 60)",
              lineHeight: 1.2,
              textShadow: "0 0 30px oklch(0.78 0.14 55 / 0.4)",
            }}
          >
            진성이에게 💌
          </h1>
          <p
            style={{
              color: "oklch(0.72 0.12 350)",
              fontSize: "0.9rem",
              marginTop: 6,
              fontFamily: "'Gowun Dodum', sans-serif",
            }}
          >
            From. 영서 ♡
          </p>
        </div>

        {/* 커플 캐릭터 */}
        <div
          className={`animate-float transition-all duration-700 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
          style={{ transitionDelay: "0.2s" }}
        >
          <img
            src={COUPLE_IMG}
            alt="영서와 진성"
            style={{
              width: "clamp(160px, 45vw, 220px)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 24px oklch(0.72 0.12 350 / 0.4))",
            }}
          />
        </div>

        {/* 설명 카드 */}
        <div
          className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{
            transitionDelay: "0.3s",
            background: "oklch(0.16 0.05 275 / 0.85)",
            border: "1px solid oklch(0.78 0.14 55 / 0.3)",
            borderRadius: 20,
            padding: "16px 20px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 oklch(1 0 0 / 8%)",
            width: "100%",
          }}
        >
          <p style={{ color: "oklch(0.88 0.03 60)", fontSize: "0.9rem", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
            우리가 함께한 소중한 순간들을<br />
            되돌아보는 여행이야 🗺️
          </p>
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid oklch(1 0 0 / 10%)",
              display: "flex",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span style={{ color: "oklch(0.78 0.14 55)", fontSize: "0.78rem" }}>⭐ 미니게임 12개</span>
            <span style={{ color: "oklch(0.72 0.12 350)", fontSize: "0.78rem" }}>💌 퀴즈</span>
            <span style={{ color: "oklch(0.75 0.15 300)", fontSize: "0.78rem" }}>🎁 엔딩</span>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          disabled={clicked}
          className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{
            transitionDelay: "0.4s",
            background: clicked
              ? "oklch(0.65 0.10 55)"
              : "linear-gradient(135deg, oklch(0.78 0.14 55), oklch(0.72 0.12 350))",
            color: "oklch(0.13 0.04 280)",
            fontFamily: "'Gowun Dodum', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            borderRadius: 999,
            padding: "14px 40px",
            border: "none",
            boxShadow: clicked
              ? "none"
              : "0 0 20px oklch(0.78 0.14 55 / 0.5), 0 4px 20px rgba(0,0,0,0.3)",
            transform: clicked ? "scale(0.95)" : "scale(1)",
            transition: "all 0.3s ease",
            cursor: clicked ? "default" : "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {clicked ? "✨ 출발!" : "🗺️ 여행 시작하기"}
        </button>

        {/* 날짜 */}
        <p
          className={`transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            transitionDelay: "0.5s",
            color: "oklch(0.50 0.05 280)",
            fontSize: "0.75rem",
            fontFamily: "'Noto Sans KR', sans-serif",
            paddingBottom: 24,
          }}
        >
          2025.01.17 ~ 지금까지 💫
        </p>
      </div>
    </div>
  );
}
