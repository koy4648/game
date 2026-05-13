interface GuideBearProps {
  message: string;
  onClose?: () => void;
  hintMode?: boolean;
}

export default function GuideBear({ message, onClose, hintMode = false }: GuideBearProps) {
  return (
    <div className="flex items-end gap-3 mb-4 animate-bounce-in max-w-sm mx-auto">
      <img
        src="/webdev-static-assets/mangrujin-nobg.png"
        alt="망곰이"
        className="w-16 h-16 object-contain flex-shrink-0"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
      />
      <div
        className="relative px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed flex-1"
        style={{
          background: "oklch(0.95 0.01 60)",
          color: "oklch(0.20 0.04 280)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        {/* 말풍선 꼬리 */}
        <div
          className="absolute -left-2 bottom-3 w-0 h-0"
          style={{
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "10px solid oklch(0.95 0.01 60)",
          }}
        />
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-1 right-2 text-[oklch(0.50_0.05_280)] hover:text-[oklch(0.20_0.04_280)] text-xs"
          >✕</button>
        )}
      </div>
    </div>
  );
}
