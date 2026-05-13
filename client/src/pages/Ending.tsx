/*
 * Ending.tsx — 프로포즈 엔딩 페이지
 * 감동적인 프로포즈 장면 + 메시지 + Yes/No 버튼
 * 디자인: 별빛 동화 테마, 최대한 로맨틱하게
 * 영서(여자친구) → 진성(남자친구) 프로포즈 사이트
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROPOSAL_IMG = "/webdev-static-assets/ending-proposal-v3.png";
const HERO_BG = "/webdev-static-assets/hero-night-sky.png";
const CHARACTER = "/webdev-static-assets/character-couple-v4.png";

const PHOTOS = [
  "/webdev-static-assets/photo-baseball.jpg",
  "/webdev-static-assets/photo-cherry.jpg",
  "/webdev-static-assets/photo-crates.jpg",
  "/webdev-static-assets/photo-bench.jpg",
  "/webdev-static-assets/photo-cafe.jpg",
  "/webdev-static-assets/photo-field.jpg",
];

// 프로포즈 메시지 — 영서님이 나중에 채워주실 자리
const PROPOSE_MESSAGE = `진성아,

우리가 처음 만난 날부터 지금까지,
너랑 함께한 모든 순간이 내 인생에서
가장 빛나는 별이 됐어.

소개팅 날 어반플랜트에서 이야기 나누던 것도,
문래에서 네 생일 챙겨주던 것도,
시청에서 드디어 사귀기로 한 날도,
에버랜드, 제주도, 영덕, 포항... 
같이 다닌 여행들도 전부 다.

네가 자꾸 왜 이렇게 예쁘냐고 물어봤잖아.
나는 그 말이 너무 좋았어.

앞으로도 계속 그 말 들을 수 있게,
내 옆에 있어줄래? 💍`;

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
  size: number;
}

export default function Ending() {
  const [step, setStep] = useState<"reveal" | "message" | "question" | "yes" | "no-escape">("reveal");
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [noClickCount, setNoClickCount] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  // 사진 슬라이드
  useEffect(() => {
    if (step !== "yes") return;
    const t = setInterval(() => setPhotoIndex((i) => (i + 1) % PHOTOS.length), 2500);
    return () => clearInterval(t);
  }, [step]);

  // 폭죽 & 하트 효과
  useEffect(() => {
    if (step !== "yes") return;

    const launchFireworks = () => {
      const colors = ["#FFD700", "#FF6B8A", "#C8A8E9", "#74B9FF", "#55EFC4", "#FDCB6E"];
      const newFw: Firework[] = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setFireworks(newFw);
      setTimeout(() => setFireworks([]), 1500);
    };

    const hearts: FloatingHeart[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 3,
      size: 16 + Math.random() * 20,
    }));
    setFloatingHearts(hearts);

    launchFireworks();
    const fw = setInterval(launchFireworks, 2500);
    return () => clearInterval(fw);
  }, [step]);

  const handleNo = () => {
    setNoClickCount((c) => c + 1);
    setNoPos({
      x: Math.random() * 60 - 30,
      y: Math.random() * 60 - 30,
    });
  };

  const noMessages = [
    "도망가지 마 😤",
    "안 돼! 다시 생각해봐 🥺",
    "진성아... 💔",
    "한 번만 더 생각해줘 🙏",
    "나 포기 안 해! 💪",
    "제발... 🥹",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ zIndex: 1 }}>
      {/* 배경 */}
      <div className="fixed inset-0" style={{
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: -1,
      }}>
        <div className="absolute inset-0" style={{ background: "rgba(10,8,30,0.65)" }} />
      </div>

      {/* 폭죽 */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 30 }}>
        {fireworks.map((fw) => (
          <motion.div
            key={fw.id}
            className="absolute"
            style={{ left: `${fw.x}%`, top: `${fw.y}%` }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1, 1.5], opacity: [1, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ background: fw.color, left: "50%", top: "50%" }}
                initial={{ x: 0, y: 0 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * (40 + Math.random() * 30),
                  y: Math.sin((i / 8) * Math.PI * 2) * (40 + Math.random() * 30),
                  opacity: 0,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* 떠다니는 하트 */}
      {step === "yes" && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }}>
          {floatingHearts.map((h) => (
            <motion.div
              key={h.id}
              className="absolute"
              style={{ left: `${h.x}%`, bottom: "-5%", fontSize: h.size }}
              animate={{ y: [0, -window.innerHeight - 100], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 6 + Math.random() * 4, delay: h.delay, repeat: Infinity, ease: "linear" }}
            >
              {["💕", "💖", "💗", "💝", "✨", "⭐"][Math.floor(Math.random() * 6)]}
            </motion.div>
          ))}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-10 relative" style={{ zIndex: 10 }}>

        {/* STEP 1: 프로포즈 이미지 공개 */}
        <AnimatePresence mode="wait">
          {step === "reveal" && (
            <motion.div
              key="reveal"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p
                className="text-sm mb-4"
                style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ✨ 마지막 챕터 ✨
              </motion.p>
              <motion.h2
                className="text-3xl font-bold text-white mb-6"
                style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                진성이에게 💌
              </motion.h2>
              <motion.div
                className="mb-6 rounded-2xl overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                style={{ boxShadow: "0 0 40px oklch(0.72 0.12 350 / 0.4)" }}
              >
                <img src={PROPOSAL_IMG} alt="프로포즈" className="w-full" />
              </motion.div>
              <motion.button
                onClick={() => setStep("message")}
                className="btn-star text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                편지 읽기 💌
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: 프로포즈 메시지 */}
          {step === "message" && (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <div className="card-glow p-6 mb-6" style={{ borderColor: "oklch(0.72 0.12 350 / 0.4)" }}>
                <div className="flex justify-center mb-4">
                  <img src={CHARACTER} alt="우리" className="w-24 h-24 object-contain" />
                </div>
                <pre
                  className="text-sm leading-relaxed whitespace-pre-wrap text-center"
                  style={{
                    color: "oklch(0.90 0.03 280)",
                    fontFamily: "'Gowun Dodum', 'Noto Sans KR', sans-serif",
                    lineHeight: 2,
                  }}
                >
                  {PROPOSE_MESSAGE}
                </pre>
              </div>
              <div className="text-center">
                <motion.button
                  onClick={() => setStep("question")}
                  className="btn-star text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  계속 읽기 →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: 질문 */}
          {step === "question" && (
            <motion.div
              key="question"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-6xl mb-6"
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                💍
              </motion.div>
              <h2
                className="text-3xl font-bold text-white mb-3"
                style={{ fontFamily: "'Gowun Dodum', sans-serif", textShadow: "0 0 20px oklch(0.72 0.12 350 / 0.6)" }}
              >
                진성아,
              </h2>
              <p
                className="text-xl mb-8"
                style={{ color: "oklch(0.88 0.06 280)", fontFamily: "'Gowun Dodum', sans-serif", lineHeight: 1.8 }}
              >
                나랑 사귀어줄래? 💕
              </p>

              {noClickCount > 0 && (
                <motion.p
                  className="text-sm mb-4"
                  style={{ color: "oklch(0.72 0.12 350)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {noMessages[Math.min(noClickCount - 1, noMessages.length - 1)]}
                </motion.p>
              )}

              <div className="flex gap-4 justify-center items-center relative" style={{ minHeight: "80px" }}>
                {/* YES 버튼 */}
                <motion.button
                  onClick={() => setStep("yes")}
                  className="btn-star text-xl px-8 py-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    boxShadow: [
                      "0 0 15px oklch(0.78 0.14 55 / 0.4)",
                      "0 0 35px oklch(0.78 0.14 55 / 0.8)",
                      "0 0 15px oklch(0.78 0.14 55 / 0.4)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  응! 💕
                </motion.button>

                {/* NO 버튼 - 도망가는 버튼 */}
                <motion.button
                  onClick={handleNo}
                  className="text-base px-6 py-3 rounded-full"
                  style={{
                    background: "oklch(0.25 0.06 275 / 0.6)",
                    border: "1px solid oklch(1 0 0 / 15%)",
                    color: "oklch(0.65 0.06 280)",
                    position: "relative",
                  }}
                  animate={{ x: noPos.x, y: noPos.y }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ x: noPos.x + (Math.random() > 0.5 ? 40 : -40), y: noPos.y + (Math.random() > 0.5 ? 20 : -20) }}
                >
                  싫어...
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: YES! */}
          {step === "yes" && (
            <motion.div
              key="yes"
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                💍
              </motion.div>
              <h2
                className="text-4xl font-bold text-white mb-3"
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  textShadow: "0 0 30px oklch(0.78 0.14 55 / 0.8)",
                }}
              >
                🎉 고마워, 진성아! 🎉
              </h2>
              <p
                className="text-lg mb-6"
                style={{ color: "oklch(0.78 0.14 55)", fontFamily: "'Gowun Dodum', sans-serif" }}
              >
                앞으로도 잘 부탁해 💕
              </p>

              {/* 사진 슬라이드쇼 */}
              <div className="relative mb-6 rounded-2xl overflow-hidden" style={{ height: "240px", boxShadow: "0 0 30px oklch(0.72 0.12 350 / 0.5)" }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={photoIndex}
                    src={PHOTOS[photoIndex]}
                    alt="우리의 추억"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: "center top" }}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,30,0.6) 0%, transparent 50%)" }} />
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-white text-sm" style={{ fontFamily: "'Gowun Dodum', sans-serif" }}>
                    우리의 소중한 순간들 💕
                  </p>
                </div>
              </div>

              <div className="card-glow p-4">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.85 0.04 280)", fontFamily: "'Gowun Dodum', sans-serif", lineHeight: 2 }}
                >
                  영서 & 진성<br />
                  2025.01.17 ~ 💕<br />
                  앞으로도 함께 별을 보러 가자 🌙✨
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
