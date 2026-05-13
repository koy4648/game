/*
 * Stage 6 - 포항·영덕: 사진 퍼즐 맞추기
 * 9조각 퍼즐을 드래그해서 맞추면 클리어!
 */
import { useState, useCallback, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

export default function GamePuzzle({ stage, onComplete }: Props) {
  const SIZE = 3; // 3x3
  const TOTAL = SIZE * SIZE;
  const IMAGE = "/webdev-static-assets/stage6-pohang.png";

  // 초기 셔플된 배열 (0~8, 정답은 [0,1,2,3,4,5,6,7,8])
  const [pieces, setPieces] = useState<number[]>(() => {
    const arr = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [dragging, setDragging] = useState<number | null>(null); // slot index
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);

  // 터치 드래그용 ref
  const gridRef = useRef<HTMLDivElement>(null);
  const touchDraggingSlot = useRef<number | null>(null);

  const swapPieces = useCallback((a: number, b: number) => {
    if (a === b) return;
    setPieces((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      if (next.every((p, i) => p === i)) {
        setCompleted(true);
        setTimeout(onComplete, 2500);
      }
      return next;
    });
    setMoves((m) => m + 1);
  }, [onComplete]);

  const handleDragStart = (slotIndex: number) => setDragging(slotIndex);

  const handleDrop = useCallback((targetIndex: number) => {
    if (dragging === null) return;
    swapPieces(dragging, targetIndex);
    setDragging(null);
    setDragOverSlot(null);
  }, [dragging, swapPieces]);

  // 터치 드래그: 손가락 위치로 슬롯 찾기
  const getSlotFromPoint = (clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const cells = Array.from(gridRef.current.querySelectorAll("[data-slot]"));
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        return parseInt((cell as HTMLElement).dataset.slot || "-1", 10);
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent, slotIndex: number) => {
    e.preventDefault();
    touchDraggingSlot.current = slotIndex;
    setDragging(slotIndex);
    setDragOverSlot(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const slot = getSlotFromPoint(touch.clientX, touch.clientY);
    setDragOverSlot(slot);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const targetSlot = getSlotFromPoint(touch.clientX, touch.clientY);
    if (touchDraggingSlot.current !== null && targetSlot !== null) {
      swapPieces(touchDraggingSlot.current, targetSlot);
    }
    touchDraggingSlot.current = null;
    setDragging(null);
    setDragOverSlot(null);
  };

  return (
    <GameLayout
      stage={stage}
      score={moves}
      hintText="조각을 드래그해서 원래 사진 모양으로 맞춰봐! 포항·영덕 여행 기억나? 🦀 🐻"
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-float">🦀</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                포항·영덕 퍼즐!
              </h2>
              <p className="text-sm mb-4" style={{ color: "oklch(0.90 0.05 60)" }}>
                흩어진 조각을 드래그해서<br />원래 사진으로 맞춰봐 🧩
              </p>
              <button className="btn-star" onClick={() => setStarted(true)}>시작!</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <p className="text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>이동 횟수: {moves}회</p>

            {/* 퍼즐 그리드 */}
            <div
              ref={gridRef}
              className="grid gap-1 rounded-xl overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
                width: "min(90vw, 360px)",
                aspectRatio: "1",
                touchAction: "none",
              }}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {pieces.map((pieceIndex, slotIndex) => {
                const row = Math.floor(pieceIndex / SIZE);
                const col = pieceIndex % SIZE;
                const isCorrectPlace = pieceIndex === slotIndex;
                const isDraggingThis = dragging === slotIndex;
                const isDragOver = dragOverSlot === slotIndex && dragging !== null && dragging !== slotIndex;
                return (
                  <div
                    key={slotIndex}
                    data-slot={slotIndex}
                    draggable
                    onDragStart={() => handleDragStart(slotIndex)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slotIndex); }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={() => { handleDrop(slotIndex); setDragOverSlot(null); }}
                    onDragEnd={() => { setDragging(null); setDragOverSlot(null); }}
                    onTouchStart={(e) => handleTouchStart(e, slotIndex)}
                    className="relative overflow-hidden rounded cursor-grab active:cursor-grabbing select-none"
                    style={{
                      aspectRatio: "1",
                      border: isDragOver
                        ? "2px solid oklch(0.72 0.20 260)"
                        : isCorrectPlace
                        ? "2px solid oklch(0.78 0.14 55)"
                        : "2px solid oklch(1 0 0 / 20%)",
                      boxShadow: isDragOver
                        ? "0 0 12px oklch(0.72 0.20 260 / 0.7)"
                        : isCorrectPlace
                        ? "0 0 8px oklch(0.78 0.14 55 / 0.5)"
                        : "none",
                      opacity: isDraggingThis ? 0.5 : 1,
                      transform: isDraggingThis ? "scale(0.95)" : "scale(1)",
                      transition: "opacity 0.15s, transform 0.15s, border 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: `${SIZE * 100}%`,
                        height: `${SIZE * 100}%`,
                        backgroundImage: `url(${IMAGE})`,
                        backgroundSize: "cover",
                        backgroundPosition: `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`,
                        transform: `translate(-${(col / SIZE) * 100}%, -${(row / SIZE) * 100}%)`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-center" style={{ color: "oklch(0.70 0.05 280)" }}>
              금테두리 조각이 올바른 위치야! 📱 손가락으로 끌어서 놓아봐
            </p>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🦀</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                퍼즐 완성! {moves}번 만에!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>다음은 제주도! 🍊</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
