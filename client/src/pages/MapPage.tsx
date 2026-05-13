/*
 * MapPage.tsx — 여행 지도 메인 화면 (16:9 가로 레이아웃)
 * 디자인: 네이비 밤하늘 + 전구 조명 + 카와이 지도
 * 인터랙션:
 *   - 완료된 장소: 컬러 reveal + 캐리커처 이미지 표시
 *   - 현재 장소: 반짝이는 전구 (클릭 → 미니게임)
 *   - 잠긴 장소: 어둡게 꺼진 상태
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useGame, STAGES } from "@/contexts/GameContext";

// 지도 v6 가로형. 흑백 상태도 같은 이미지를 필터링해서 비율이 틀어지지 않게 유지한다.
const MAP_COLOR = "/webdev-static-assets/travel-map-v6.png";
const MAP_BW = MAP_COLOR;
const MAP_ASPECT_RATIO = "2752 / 1536";

// 각 장소의 핀 위치 (지도 이미지 기준 %, 시각적으로 확인한 위치)
// STAGES 순서에 맞춘 진행 순서: 합정 → 시청 → 에버랜드 → 제주도 → 코엑스 → 포항 → 칠갑산 → 그민페 → 대전 → 벚꽃스냅 → 보성 → 야구장
const MAP_PINS: Record<number, { x: number; y: number; label: string }> = {
   1: { x: 12.6, y: 39.5, label: "합정" },        // 왼쪽 카페
   2: { x: 24.5, y: 61.0, label: "시청" },        // 벚꽃 건물 + 커플
   3: { x: 30.0, y: 28.5, label: "에버랜드" },    // 놀이공원
   4: { x: 88.5, y: 89.0, label: "제주도" },      // 제주 섬
   5: { x: 47.8, y: 50.5, label: "코엑스" },      // 아쿠아리움
   6: { x: 83.7, y: 57.5, label: "포항" },        // 등대 + 배
   7: { x: 45.5, y: 78.0, label: "칠갑산" },      // 단풍산
   8: { x: 52.8, y: 29.0, label: "그민페" },      // 올림픽공원
   9: { x: 61.5, y: 57.0, label: "대전" },        // 다리 + 도시
  10: { x: 19.8, y: 78.5, label: "벚꽃스냅" },    // 벚꽃 강
  11: { x: 65.0, y: 85.0, label: "보성" },        // 녹차밭
  12: { x: 73.5, y: 26.0, label: "야구장" },      // 잠실 야구장
};

// 전구 장식
const BULBS = Array.from({ length: 14 }, (_, i) => ({
  left: (i / 13) * 100,
  color: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFB6C1" : "#FFF8DC",
}));

// 별 배경
const STARS = Array.from({ length: 18 }, (_, i) => ({
  left: ((i * 37 + 13) % 100),
  top: ((i * 53 + 7) % 100),
  size: 4 + (i % 4) * 2,
  delay: (i * 0.3) % 3,
  dur: 1.5 + (i % 4) * 0.5,
}));

export default function MapPage() {
  const [, navigate] = useLocation();
  const { completedStages } = useGame();
  const [mounted, setMounted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const colorImgRef = useRef<HTMLImageElement | null>(null);
  const bwImgRef = useRef<HTMLImageElement | null>(null);

  // 현재 활성화된 스테이지 (다음에 해야 할 것)
  const activeStageId = Math.min(completedStages.length + 1, STAGES.length);

  useEffect(() => { setMounted(true); }, []);

  // 캔버스 렌더링 함수
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = mapContainerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width) || 800;
    const h = Math.round(rect.height) || 450;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // 1. 흑백 지도 그리기
    if (bwImgRef.current) {
      ctx.filter = "grayscale(100%) brightness(0.65)";
      ctx.drawImage(bwImgRef.current, 0, 0, w, h);
      ctx.filter = "none";
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, w, h);
    }

    if (!colorImgRef.current) return;

    // 2. 완료된 장소마다 원형 컬러 reveal
    completedStages.forEach((stageId) => {
      const pin = MAP_PINS[stageId];
      if (!pin) return;
      const cx = (pin.x / 100) * w;
      const cy = (pin.y / 100) * h;
      const radius = Math.min(w, h) * 0.11;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(colorImgRef.current!, 0, 0, w, h);
      ctx.restore();

      // 골드 테두리
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    });
  }, [completedStages]);

  // 이미지 로드
  useEffect(() => {
    let colorLoaded = false;
    let bwLoaded = false;
    const tryRender = () => {
      if (colorLoaded && bwLoaded) {
        setCanvasReady(true);
        renderCanvas();
      }
    };

    const colorImg = new Image();
    colorImg.crossOrigin = "anonymous";
    colorImg.src = MAP_COLOR;
    colorImg.onload = () => { colorImgRef.current = colorImg; colorLoaded = true; tryRender(); };
    colorImg.onerror = () => { colorLoaded = true; tryRender(); };

    const bwImg = new Image();
    bwImg.crossOrigin = "anonymous";
    bwImg.src = MAP_BW;
    bwImg.onload = () => { bwImgRef.current = bwImg; bwLoaded = true; tryRender(); };
    bwImg.onerror = () => { bwLoaded = true; tryRender(); };
  }, []);

  useEffect(() => { if (canvasReady) renderCanvas(); }, [completedStages, canvasReady, renderCanvas]);

  useEffect(() => {
    const handleResize = () => { if (canvasReady) setTimeout(renderCanvas, 100); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasReady, renderCanvas]);

  const handlePinClick = (stageId: number) => {
    if (stageId === activeStageId) {
      navigate(`/stage/${stageId}`);
    }
  };

  const getStageCaricature = (stageId: number) => {
    const stage = STAGES.find((s) => s.id === stageId);
    return stage?.caricature || null;
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(180deg, oklch(0.10 0.06 285) 0%, oklch(0.14 0.08 270) 50%, oklch(0.10 0.06 285) 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* 골드 테두리 */}
      <div style={{ position: "fixed", inset: 8, border: "2px solid oklch(0.78 0.14 55 / 0.35)", borderRadius: 16, zIndex: 50, pointerEvents: "none" }} />
      {/* 모서리 장식 */}
      {[
        { cls: "top-3 left-3", r: "8px 0 0 0" },
        { cls: "top-3 right-3", r: "0 8px 0 0" },
        { cls: "bottom-3 left-3", r: "0 0 0 8px" },
        { cls: "bottom-3 right-3", r: "0 0 8px 0" },
      ].map(({ cls, r }, i) => (
        <div key={i} className={`fixed ${cls}`} style={{ width: 24, height: 24, border: "2px solid oklch(0.78 0.14 55 / 0.6)", borderRadius: r, zIndex: 51, pointerEvents: "none" }} />
      ))}

      {/* 별 배경 */}
      {STARS.map((s, i) => (
        <div key={i} className="fixed animate-twinkle" style={{ left: `${s.left}%`, top: `${s.top}%`, fontSize: `${s.size}px`, color: "oklch(0.95 0.05 60)", animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`, opacity: 0.35, zIndex: 1, pointerEvents: "none" }}>✦</div>
      ))}

      {/* 전구 줄 (상단) */}
      <div style={{ position: "relative", height: 36, flexShrink: 0, zIndex: 10 }}>
        <div style={{ position: "absolute", top: 18, left: "3%", right: "3%", height: 1.5, background: "oklch(0.78 0.14 55 / 0.35)" }} />
        {BULBS.map((b, i) => (
          <div key={i} style={{ position: "absolute", left: `${3 + b.left * 0.94}%`, top: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 10, height: 13, borderRadius: "50% 50% 40% 40%", background: b.color, boxShadow: `0 0 6px ${b.color}, 0 0 12px ${b.color}60` }} />
          </div>
        ))}
      </div>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 20px 4px", flexShrink: 0, zIndex: 10 }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "oklch(0.18 0.05 275 / 0.8)", border: "1px solid oklch(0.78 0.14 55 / 0.4)", borderRadius: 999, padding: "5px 14px", color: "oklch(0.78 0.14 55)", fontSize: "0.8rem", fontFamily: "'Gowun Dodum', sans-serif", cursor: "pointer" }}
        >← 홈</button>

        {/* 진행 도트 */}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {STAGES.map((s) => (
            <div key={s.id} style={{
              width: completedStages.includes(s.id) ? 9 : s.id === activeStageId ? 11 : 7,
              height: completedStages.includes(s.id) ? 9 : s.id === activeStageId ? 11 : 7,
              borderRadius: "50%",
              background: completedStages.includes(s.id) ? "oklch(0.72 0.12 350)" : s.id === activeStageId ? "oklch(0.78 0.14 55)" : "oklch(1 0 0 / 15%)",
              boxShadow: s.id === activeStageId ? "0 0 8px oklch(0.78 0.14 55 / 0.8)" : "none",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        <div style={{ color: "oklch(0.78 0.14 55)", fontSize: "0.8rem", fontFamily: "'Gowun Dodum', sans-serif" }}>
          {completedStages.length} / {STAGES.length} ✦
        </div>
      </div>

      {/* 메인 지도 영역 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 16px 4px", zIndex: 10, overflow: "hidden" }}>
        <div
          ref={mapContainerRef}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "calc((100vh - 110px) * 2752 / 1536)",
            aspectRatio: MAP_ASPECT_RATIO,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 0 40px oklch(0.78 0.14 55 / 0.2), 0 8px 32px rgba(0,0,0,0.5)",
            border: "2px solid oklch(0.78 0.14 55 / 0.3)",
          }}
        >
          {/* 캔버스 (흑백 + 컬러 reveal) */}
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

          {/* 폴백 이미지 */}
          {!canvasReady && (
            <img src={MAP_BW} alt="여행 지도" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) brightness(0.65)" }} />
          )}

          {/* 핀 오버레이 */}
          {STAGES.map((stage) => {
            const pin = MAP_PINS[stage.id];
            if (!pin) return null;
            const isCompleted = completedStages.includes(stage.id);
            const isActive = stage.id === activeStageId;
            const isLocked = !isCompleted && !isActive;
            const caricature = getStageCaricature(stage.id);

            return (
              <div
                key={stage.id}
                onClick={() => handlePinClick(stage.id)}
                style={{
                  position: "absolute",
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: isActive ? "pointer" : "default",
                  zIndex: isActive ? 8 : isCompleted ? 7 : 5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {/* 완료된 장소: 캐리커처 원형 이미지 */}
                {isCompleted && caricature && (
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid oklch(0.78 0.14 55 / 0.9)",
                    boxShadow: "0 0 10px oklch(0.78 0.14 55 / 0.6)",
                    background: "oklch(0.18 0.05 275)",
                    animation: "bounce-in 0.5s ease",
                  }}>
                    <img src={caricature} alt={pin.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                {/* 활성 장소: 반짝이는 전구 */}
                {isActive && (
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #FFD700 30%, #FF9500 100%)",
                    boxShadow: "0 0 16px #FFD700, 0 0 32px #FFD70080",
                    animation: "pulse-glow 1.2s ease-in-out infinite",
                    border: "2px solid rgba(255,255,255,0.9)",
                    cursor: "pointer",
                  }} />
                )}

                {/* 잠긴 장소: 작은 어두운 점 */}
                {isLocked && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(1 0 0 / 15%)" }} />
                )}

                {/* 라벨 (활성/완료만) */}
                {(isActive || isCompleted) && (
                  <div style={{
                    background: isActive ? "oklch(0.78 0.14 55 / 0.95)" : "oklch(0.14 0.05 275 / 0.88)",
                    border: `1px solid ${isActive ? "rgba(255,215,0,0.9)" : "oklch(0.78 0.14 55 / 0.4)"}`,
                    borderRadius: 999,
                    padding: "2px 7px",
                    fontSize: "0.62rem",
                    fontFamily: "'Gowun Dodum', sans-serif",
                    color: isActive ? "oklch(0.13 0.04 280)" : "oklch(0.88 0.03 60)",
                    whiteSpace: "nowrap",
                    fontWeight: isActive ? 700 : 400,
                    boxShadow: isActive ? "0 0 8px rgba(255,215,0,0.6)" : "none",
                    marginTop: 1,
                  }}>
                    {isActive ? `✨ ${pin.label}` : `✓ ${pin.label}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 안내 */}
      <div style={{ textAlign: "center", padding: "2px 0 10px", color: "oklch(0.55 0.05 280)", fontSize: "0.72rem", fontFamily: "'Noto Sans KR', sans-serif", flexShrink: 0, zIndex: 10 }}>
        {completedStages.length < STAGES.length
          ? `✨ 반짝이는 ${MAP_PINS[activeStageId]?.label}을 클릭해보세요!`
          : "🎉 모든 여행지를 완료했어요! 엔딩으로 이동하세요"}
      </div>
    </div>
  );
}
