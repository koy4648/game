import React from "react";

interface StartOverlayProps {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  onStart: () => void;
  buttonText?: string;
}

export function GameStartOverlay({ title, description, icon, onStart, buttonText = "시작하기" }: StartOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/50 backdrop-blur-sm animate-fade-in px-4">
      <div className="text-6xl animate-float mb-4" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>{icon}</div>
      <div 
        className="card-glow p-8 text-center max-w-sm w-full"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.05 275 / 0.95), oklch(0.13 0.04 280 / 0.95))",
          border: "2px solid oklch(0.78 0.14 55 / 0.6)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px oklch(0.78 0.14 55 / 0.15)",
        }}
      >
        <h2 className="text-xl font-bold mb-4 break-keep" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
          {title}
        </h2>
        <div className="text-sm mb-7 leading-relaxed break-keep" style={{ color: "oklch(0.90 0.05 60)" }}>
          {description}
        </div>
        <button className="btn-star w-full max-w-[200px]" onClick={onStart}>{buttonText}</button>
      </div>
    </div>
  );
}

interface ClearOverlayProps {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  onNext: () => void;
  buttonText?: string;
}

export function GameClearOverlay({ title, description, icon, onNext, buttonText = "다음으로 💕" }: ClearOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 animate-fade-in backdrop-blur-md px-4">
      <div 
        className="card-glow p-8 text-center animate-bounce-in max-w-sm w-full"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.05 275 / 0.98), oklch(0.13 0.04 280 / 0.98))",
          border: "2px solid oklch(0.78 0.14 55 / 0.8)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 0 20px oklch(0.78 0.14 55 / 0.25)",
        }}
      >
        <div className="text-6xl mb-5" style={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.4))", animation: "bounce-in 0.8s ease-out forwards" }}>{icon}</div>
        <h2 className="text-2xl font-bold mb-4 break-keep" style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}>
          {title}
        </h2>
        <div className="text-sm mb-7 leading-relaxed break-keep" style={{ color: "oklch(0.90 0.05 60)" }}>
          {description}
        </div>
        <button className="btn-star w-full max-w-[200px]" onClick={onNext}>{buttonText}</button>
      </div>
    </div>
  );
}
