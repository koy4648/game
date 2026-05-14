/*
 * Stage 6 - 포항 & 영덕: 스크래치 오프 추억 공개 게임
 * 회색 캔버스를 긁어 바다 사진을 70% 이상 드러내면 클리어 메시지를 보여준다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const SCRATCH_IMAGE = "/webdev-static-assets/stage6-pophang-scratch.png";
const IMAGE_WIDTH = 1448;
const IMAGE_HEIGHT = 1086;
const BRUSH_SIZE = 48;
const CLEAR_THRESHOLD = 70;

export default function Stage06PohangScratchGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scratchingRef = useRef(false);
  const clearedRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const checkTimerRef = useRef<number | null>(null);

  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const paintOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d7d7d7");
    gradient.addColorStop(0.45, "#c0c0c0");
    gradient.addColorStop(1, "#a9a9a9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.16;
    for (let y = 0; y < height; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? "#ffffff" : "#8f8f8f";
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    if (!started || cleared) return;
    paintOverlay();

    const handleResize = () => paintOverlay();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (checkTimerRef.current !== null) {
        window.clearTimeout(checkTimerRef.current);
        checkTimerRef.current = null;
      }
    };
  }, [started, cleared, paintOverlay]);

  const calculateProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || clearedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let transparent = 0;
    let total = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const alpha = data[(y * width + x) * 4 + 3];
        total += 1;
        if (alpha < 25) transparent += 1;
      }
    }

    const nextProgress = Math.round((transparent / total) * 100);
    setProgress(nextProgress);

    if (nextProgress >= CLEAR_THRESHOLD) {
      clearedRef.current = true;
      scratchingRef.current = false;
      setCleared(true);
      setProgress(100);
      window.setTimeout(() => setOverlayVisible(false), 80);
    }
  }, []);

  const scheduleProgressCheck = useCallback(() => {
    if (checkTimerRef.current !== null) return;
    checkTimerRef.current = window.setTimeout(() => {
      checkTimerRef.current = null;
      calculateProgress();
    }, 140);
  }, [calculateProgress]);

  const scratchTo = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || clearedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previous = lastPointRef.current ?? { x, y };
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH_SIZE;
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.arc(x, y, BRUSH_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    lastPointRef.current = { x, y };
    scheduleProgressCheck();
  }, [scheduleProgressCheck]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (clearedRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    scratchingRef.current = true;
    lastPointRef.current = point;
    scratchTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scratchingRef.current) return;
    const point = getPoint(event);
    scratchTo(point.x, point.y);
  };

  const stopScratching = () => {
    scratchingRef.current = false;
    lastPointRef.current = null;
    calculateProgress();
  };

  const resetGame = () => {
    clearedRef.current = false;
    scratchingRef.current = false;
    lastPointRef.current = null;
    setStarted(false);
    setCleared(false);
    setProgress(0);
    setOverlayVisible(true);
  };

  return (
    <GameLayout
      stage={stage}
      score={progress}
      maxScore={100}
      hintText="은색 부분을 문질러서 포항 바다 추억을 꺼내줘. 70% 이상 드러나면 클리어!"
      onRetry={resetGame}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3">
        {!started ? (
          <div className="card-glow p-7 text-center max-w-sm">
            <div className="text-5xl mb-3">🌊</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.82 0.11 210)", fontFamily: "'Gowun Dodum', sans-serif" }}>
              포항 바다 스크래치
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.92 0.04 75)" }}>
              은빛 막을 살살 긁어서<br />
              바다 앞 추억을 다시 보여줘.
            </p>
            <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center gap-3">
            <div
              className="relative w-full overflow-hidden"
              ref={wrapRef}
              style={{
                maxWidth: "min(86vw, 900px)",
                aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}`,
                borderRadius: 16,
                border: "2px solid oklch(0.82 0.11 210 / 0.55)",
                boxShadow: "0 20px 52px rgba(0,0,0,0.36), 0 0 36px oklch(0.75 0.11 210 / 0.28)",
                background: "oklch(0.14 0.04 230)",
              }}
            >
              <img
                src={SCRATCH_IMAGE}
                alt="포항 바다 추억"
                draggable={false}
                className="absolute inset-0 block w-full h-full select-none"
                style={{ objectFit: "cover" }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 block w-full h-full touch-none select-none"
                style={{
                  opacity: overlayVisible ? 1 : 0,
                  transition: "opacity 900ms ease",
                  cursor: cleared ? "default" : "grab",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopScratching}
                onPointerCancel={stopScratching}
                onPointerLeave={stopScratching}
              />

              {cleared && (
                <div
                  className="absolute inset-x-4 bottom-4 sm:bottom-6 flex justify-center animate-fade-in"
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    className="text-center"
                    style={{
                      maxWidth: 620,
                      padding: "16px 20px",
                      borderRadius: 14,
                      background: "linear-gradient(180deg, oklch(0.16 0.05 230 / 0.72), oklch(0.13 0.04 240 / 0.62))",
                      border: "1px solid oklch(0.86 0.08 80 / 0.55)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <p
                      className="text-lg sm:text-2xl font-bold leading-relaxed"
                      style={{
                        color: "oklch(0.96 0.04 80)",
                        fontFamily: "'Gowun Dodum', sans-serif",
                        textShadow: "0 2px 12px rgba(0,0,0,0.65)",
                      }}
                    >
                      나랑 앞으로도 계속 바다 보러 가 줄거지?
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-md h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0.04 230 / 0.8)" }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, oklch(0.72 0.11 210), oklch(0.88 0.10 75))",
                }}
              />
            </div>

            {cleared && (
              <button className="btn-star animate-bounce-in" onClick={onComplete}>
                Next Stage
              </button>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
