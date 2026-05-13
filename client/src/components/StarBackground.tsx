import { useEffect, useRef } from "react";

/*
 * StarBackground: 별빛 동화 테마의 반짝이는 별 배경
 * 고정 위치로 전체 화면에 렌더링되며 인터랙션을 방해하지 않음
 */
export default function StarBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stars: HTMLDivElement[] = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 4;
      const duration = Math.random() * 3 + 2;
      const opacity = Math.random() * 0.6 + 0.2;

      star.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: white;
        opacity: ${opacity};
        animation: twinkle ${duration}s ${delay}s ease-in-out infinite;
      `;
      container.appendChild(star);
      stars.push(star);
    }

    // 가끔 유성 효과
    const shootingInterval = setInterval(() => {
      const shooting = document.createElement("div");
      const startX = Math.random() * 60;
      const startY = Math.random() * 40;
      shooting.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        width: 80px;
        height: 2px;
        background: linear-gradient(90deg, white, transparent);
        border-radius: 9999px;
        opacity: 0;
        animation: shooting-star 1s ease-out forwards;
        transform: rotate(-30deg);
      `;
      container.appendChild(shooting);
      setTimeout(() => {
        if (container.contains(shooting)) container.removeChild(shooting);
      }, 1200);
    }, 4000);

    return () => {
      clearInterval(shootingInterval);
      stars.forEach((s) => {
        if (container.contains(s)) container.removeChild(s);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="stars-bg"
      style={{ zIndex: 0 }}
    />
  );
}
