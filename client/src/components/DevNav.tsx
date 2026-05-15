/*
 * DevNav: 개발자용 빠른 페이지 이동 메뉴
 * 화면 왼쪽 하단에 작은 버튼으로 표시, 클릭하면 전체 페이지 목록 펼쳐짐
 */
import { useState } from "react";
import { useLocation } from "wouter";

const PAGES = [
  { label: "🏠 홈", path: "/" },
  { label: "🗺️ 맵", path: "/map" },
  { label: "☕ 1. 합정 소개팅", path: "/stage/1" },
  { label: "💑 2. 시청 고백", path: "/stage/2" },
  { label: "🎢 3. 에버랜드", path: "/stage/3" },
  { label: "🍊 4. 제주도", path: "/stage/4" },
  { label: "🐠 5. 코엑스 아쿠아리움", path: "/stage/5" },
  { label: "🌊 6. 포항·영덕", path: "/stage/6" },
  { label: "🏔️ 7. 칠갑산", path: "/stage/7" },
  { label: "🎵 8. 올림픽공원 GMF", path: "/stage/8" },
  { label: "💍 9. 대전 1주년", path: "/stage/9" },
  { label: "🌸 10. 양재천 벚꽃스냅", path: "/stage/10" },
  { label: "🍵 11. 보성 녹차마라톤", path: "/stage/11" },
  { label: "⚾ 12. 잠실 야구장", path: "/stage/12" },
  { label: "📝 퀴즈", path: "/quiz" },
  { label: "💌 엔딩", path: "/ending" },
];

export default function DevNav() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div
          className="mb-2 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "oklch(0.13 0.04 280 / 0.95)",
            border: "1px solid oklch(0.78 0.14 55 / 0.4)",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <div
            className="px-3 py-2 text-xs font-bold border-b"
            style={{ color: "oklch(0.78 0.14 55)", borderColor: "oklch(0.78 0.14 55 / 0.2)" }}
          >
            🛠 개발자 메뉴
          </div>
          {PAGES.map((page) => (
            <button
              key={page.path}
              onClick={() => {
                navigate(page.path);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs transition-all hover:bg-white/10"
              style={{ color: "oklch(0.90 0.05 60)" }}
            >
              {page.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg transition-all hover:scale-110"
        style={{
          background: "oklch(0.18 0.05 275 / 0.9)",
          border: "1px solid oklch(0.78 0.14 55 / 0.5)",
        }}
        title="개발자 메뉴"
      >
        {open ? "✕" : "🛠"}
      </button>
    </div>
  );
}
