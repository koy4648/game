/*
 * 퍼즐 게임
 * - Stage 4 제주도: 4x4 자유 드래그 스냅 퍼즐
 * - 그 외: 기존 슬롯 교환형 3x3 퍼즐
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

interface DragPiece {
  x: number;
  y: number;
  locked: boolean;
}

const JEJU_IMAGE = "/webdev-static-assets/stage4-jeju-puzzle.png";
const JEJU_ORIGINAL_IMAGE = "/webdev-static-assets/stage4-orig.jpg";
const POHANG_IMAGE = "/webdev-static-assets/stage6-pohang.png";

export default function GamePuzzle({ stage, onComplete }: Props) {
  if (stage.id === 4) {
    return <JejuFreePuzzle stage={stage} onComplete={onComplete} />;
  }
  return <SlotSwapPuzzle stage={stage} onComplete={onComplete} />;
}

function createJejuPieces() {
  const size = 4;
  const pieceSize = 100 / size;
  const slots = Array.from({ length: size * size }, (_, i) => i);

  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  if (slots.some((slot, piece) => slot === piece)) {
    [slots[0], slots[1]] = [slots[1], slots[0]];
  }

  return slots.map((slot) => {
    const row = Math.floor(slot / size);
    const col = slot % size;
    return {
      x: Math.max(0, Math.min(100 - pieceSize, col * pieceSize + (Math.random() - 0.5) * 8)),
      y: Math.max(0, Math.min(100 - pieceSize, row * pieceSize + (Math.random() - 0.5) * 8)),
      locked: false,
    };
  });
}

function JejuFreePuzzle({ stage, onComplete }: Props) {
  const SIZE = 4;
  const TOTAL = SIZE * SIZE;
  const PIECE_SIZE = 100 / SIZE;
  const SNAP_DISTANCE = 7.5;
  const [started, setStarted] = useState(false);
  const [pieces, setPieces] = useState<DragPiece[]>(createJejuPieces);
  const [dragging, setDragging] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("원본 사진을 기억해줘!");
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, []);

  const completeIfSolved = useCallback((nextPieces: DragPiece[]) => {
    if (nextPieces.every((piece) => piece.locked)) {
      setCompleted(true);
      setTimeout(onComplete, 2500);
    }
  }, [onComplete]);

  const getPointerPercent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (completed || pieces[index].locked) return;
    const pointer = getPointerPercent(event);
    if (!pointer) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      index,
      offsetX: pointer.x - pieces[index].x,
      offsetY: pointer.y - pieces[index].y,
    };
    setDragging(index);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const pointer = getPointerPercent(event);
    if (!pointer) return;
    const { index, offsetX, offsetY } = dragRef.current;
    const nextX = Math.max(0, Math.min(100 - PIECE_SIZE, pointer.x - offsetX));
    const nextY = Math.max(0, Math.min(100 - PIECE_SIZE, pointer.y - offsetY));
    setPieces((prev) => prev.map((piece, i) => i === index ? { ...piece, x: nextX, y: nextY } : piece));
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    const { index } = dragRef.current;
    dragRef.current = null;
    setDragging(null);
    setMoves((count) => count + 1);

    setPieces((prev) => {
      const correctRow = Math.floor(index / SIZE);
      const correctCol = index % SIZE;
      const correctX = correctCol * PIECE_SIZE;
      const correctY = correctRow * PIECE_SIZE;
      const piece = prev[index];
      const distance = Math.hypot(piece.x - correctX, piece.y - correctY);
      const shouldSnap = distance <= SNAP_DISTANCE;
      const next = prev.map((current, i) =>
        i === index && shouldSnap
          ? { x: correctX, y: correctY, locked: true }
          : current
      );
      completeIfSolved(next);
      return next;
    });
  };

  const resetPuzzle = () => {
    dragRef.current = null;
    setPieces(createJejuPieces());
    setDragging(null);
    setMoves(0);
    setCompleted(false);
  };

  const showOriginalPreview = (autoClose: boolean) => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    setPreviewTitle(autoClose ? "2초 동안 원본 사진을 기억해줘!" : "원본 사진 다시 보기");
    setPreviewVisible(true);
    if (autoClose) {
      previewTimerRef.current = window.setTimeout(() => {
        setPreviewVisible(false);
        previewTimerRef.current = null;
      }, 2000);
    }
  };

  const startPuzzle = () => {
    setStarted(true);
    showOriginalPreview(true);
  };

  return (
    <GameLayout
      stage={stage}
      score={pieces.filter((piece) => piece.locked).length}
      maxScore={TOTAL}
      hintText="사진 조각을 드래그해서 맞는 위치 근처에 놓으면 자동으로 딱 맞춰져! 16조각을 모두 완성해봐."
      onHint={() => showOriginalPreview(false)}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-2">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-float">🍊</div>
            <div className="card-glow p-6 text-center max-w-sm">
              <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                제주도 4x4 퍼즐!
              </h2>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: "oklch(0.90 0.05 60)" }}>
                우리의 첫 여행 베스트 컷을<br />
                16조각으로 다시 맞춰보자 🧩
              </p>
              <button className="btn-star" onClick={startPuzzle}>퍼즐 시작!</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <div className="flex items-center justify-between w-full text-xs" style={{ color: "oklch(0.70 0.05 280)" }}>
              <span>맞춘 조각: {pieces.filter((piece) => piece.locked).length} / {TOTAL}</span>
              <span>이동 횟수: {moves}회</span>
            </div>

            <div
              ref={boardRef}
              className="relative rounded-xl overflow-hidden"
              style={{
                width: "min(90vw, 390px)",
                aspectRatio: "1",
                touchAction: "none",
                background: "linear-gradient(135deg, oklch(0.30 0.01 270), oklch(0.20 0.02 280))",
                border: "2px solid oklch(0.78 0.14 55 / 0.45)",
                boxShadow: "0 12px 36px rgba(0,0,0,0.36)",
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {Array.from({ length: SIZE + 1 }, (_, i) => (
                <div key={`v-${i}`} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${i * PIECE_SIZE}%`, width: 1, background: "oklch(1 0 0 / 0.12)" }} />
              ))}
              {Array.from({ length: SIZE + 1 }, (_, i) => (
                <div key={`h-${i}`} className="absolute left-0 right-0 pointer-events-none" style={{ top: `${i * PIECE_SIZE}%`, height: 1, background: "oklch(1 0 0 / 0.12)" }} />
              ))}

              {pieces.map((piece, index) => {
                const row = Math.floor(index / SIZE);
                const col = index % SIZE;
                const isDragging = dragging === index;
                return (
                  <div
                    key={index}
                    onPointerDown={(event) => handlePointerDown(event, index)}
                    className="absolute rounded-md overflow-hidden select-none"
                    style={{
                      left: `${piece.x}%`,
                      top: `${piece.y}%`,
                      width: `${PIECE_SIZE}%`,
                      aspectRatio: "1",
                      cursor: piece.locked ? "default" : "grab",
                      zIndex: piece.locked ? 2 : isDragging ? 30 : 10 + index,
                      border: piece.locked
                        ? "2px solid oklch(0.78 0.14 55 / 0.9)"
                        : "2px solid oklch(1 0 0 / 0.55)",
                      boxShadow: piece.locked
                        ? "0 0 12px oklch(0.78 0.14 55 / 0.45)"
                        : "0 6px 18px rgba(0,0,0,0.34)",
                      transform: isDragging ? "scale(1.04)" : "scale(1)",
                      transition: isDragging ? "none" : "left 0.16s ease, top 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease",
                    }}
                  >
                    <div
                      style={{
                        width: `${SIZE * 100}%`,
                        height: `${SIZE * 100}%`,
                        backgroundImage: `url(${JEJU_IMAGE})`,
                        backgroundSize: "cover",
                        backgroundPosition: `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`,
                        transform: `translate(-${(col / SIZE) * 100}%, -${(row / SIZE) * 100}%)`,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs text-center" style={{ color: "oklch(0.70 0.05 280)" }}>
                맞는 위치 가까이에 놓으면 자동으로 스냅돼요.
              </p>
              <button className="text-xs underline" style={{ color: "oklch(0.78 0.14 55)" }} onClick={resetPuzzle}>
                다시 섞기
              </button>
            </div>
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
            <div className="card-glow p-8 text-center animate-bounce-in max-w-sm">
              <div className="text-5xl mb-3">🍊🧩</div>
              <h2 className="text-xl font-bold" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                제주도 퍼즐 완성!
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>
                첫 여행의 마지막 순간! 피곤했지만 정말 즐거웠지? 💕
              </p>
            </div>
          </div>
        )}

        {previewVisible && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in"
            style={{ background: "oklch(0.05 0.03 285 / 0.84)", backdropFilter: "blur(8px)" }}
            onClick={() => setPreviewVisible(false)}
          >
            <div
              className="w-full max-w-lg"
              style={{
                background: "oklch(0.13 0.05 275 / 0.96)",
                border: "2px solid oklch(0.78 0.14 55 / 0.58)",
                borderRadius: 18,
                padding: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,0.48)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-bold" style={{ color: "oklch(0.80 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
                  {previewTitle}
                </p>
                <button
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: "oklch(0.22 0.05 275)",
                    border: "1px solid oklch(1 0 0 / 0.18)",
                    color: "oklch(0.90 0.05 60)",
                  }}
                  onClick={() => setPreviewVisible(false)}
                >
                  닫기
                </button>
              </div>
              <img
                src={JEJU_ORIGINAL_IMAGE}
                alt="제주도 원본 사진"
                className="w-full"
                style={{
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: 12,
                  background: "oklch(0.08 0.03 285)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

function SlotSwapPuzzle({ stage, onComplete }: Props) {
  const SIZE = 3;
  const TOTAL = SIZE * SIZE;

  const [pieces, setPieces] = useState<number[]>(() => {
    const arr = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);

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

  const getSlotFromPoint = (clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const cells = Array.from(gridRef.current.querySelectorAll("[data-slot]"));
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return parseInt((cell as HTMLElement).dataset.slot || "-1", 10);
      }
    }
    return null;
  };

  const handleTouchStart = (event: React.TouchEvent, slotIndex: number) => {
    event.preventDefault();
    touchDraggingSlot.current = slotIndex;
    setDragging(slotIndex);
    setDragOverSlot(null);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    const slot = getSlotFromPoint(touch.clientX, touch.clientY);
    setDragOverSlot(slot);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    const touch = event.changedTouches[0];
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
      hintText="조각을 드래그해서 원래 사진 모양으로 맞춰봐! 포항·영덕 여행 기억나? 🦀"
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
                    onDragOver={(event) => { event.preventDefault(); setDragOverSlot(slotIndex); }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={() => { handleDrop(slotIndex); setDragOverSlot(null); }}
                    onDragEnd={() => { setDragging(null); setDragOverSlot(null); }}
                    onTouchStart={(event) => handleTouchStart(event, slotIndex)}
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
                        backgroundImage: `url(${POHANG_IMAGE})`,
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
              금테두리 조각이 올바른 위치야! 손가락으로 끌어서 놓아봐.
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
              <p className="text-sm mt-2" style={{ color: "oklch(0.90 0.05 60)" }}>다음 추억으로 가보자 💕</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
