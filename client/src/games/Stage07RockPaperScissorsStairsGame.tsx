/*
 * Stage 7 - 칠갑산: 가위바위보 계단 오르기 게임
 * 진성의 입장에서 플레이하며, 영서가 무사히 칠갑산 정상에 먼저 도착하도록 눈치껏 져주어야 한다.
 *
 * 상태 변수:
 *   yeongseo_step: 0~5 (5 = 정상 도착)
 *   jinseong_step: 0~5
 *   is_yeongseo_invincible: jinseong_step == 4 팝업에서 [예] 선택 후 true
 *
 * 특수 이벤트:
 *   jinseong_step == 4 도달 시 팝업 → [아니오] 깨물 이미지 → [예] 무적 모드 발동
 *   무적 모드: 유저가 내는 패에 상관없이 영서가 무조건 이기는 패를 냄
 *
 * 클리어 조건:
 *   yeongseo_step == 5 → 성공 메시지 + [다음 기억으로] 버튼
 */
import { useState, useEffect, useRef } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const IMG_JINSEONG = "/webdev-static-assets/caricature-chilgapsan-jinseong.png";
const IMG_YEONGSEO_WIN = "/webdev-static-assets/caricature-chilgapsan-0win.png";
const IMG_YEONGSEO_LOSE = "/webdev-static-assets/caricature-chilgapsan-0lose.png";
const IMG_BITE = "/webdev-static-assets/caricature-bite.png";

type Choice = "가위" | "바위" | "보";
type RoundResult = "win" | "lose" | "draw";

const CHOICE_EMOJI: Record<Choice, string> = {
  가위: "✌️",
  바위: "✊",
  보: "🖐️",
};

// 유저가 낸 패를 이기는 패 반환 (무적 모드용)
function getWinningChoice(userChoice: Choice): Choice {
  if (userChoice === "가위") return "바위";
  if (userChoice === "바위") return "보";
  return "가위";
}

// 랜덤 패 반환
function getRandomChoice(): Choice {
  const choices: Choice[] = ["가위", "바위", "보"];
  return choices[Math.floor(Math.random() * 3)];
}

// 승패 판별 (진성 기준)
function judgeResult(user: Choice, opponent: Choice): RoundResult {
  if (user === opponent) return "draw";
  if (
    (user === "가위" && opponent === "바위") ||
    (user === "바위" && opponent === "보") ||
    (user === "보" && opponent === "가위")
  ) {
    return "lose"; // 진성이 짐 → 영서 승리
  }
  return "win"; // 진성이 이김
}

// ─── 계단 시각화 컴포넌트 ────────────────────────────────────────────────────
interface StairProps {
  step: number;
  color: string;
  label: string;
  emoji: string;
}

function StairTrack({ step, color, label, emoji }: StairProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          fontSize: "0.65rem",
          color: "oklch(0.75 0.05 280)",
          fontFamily: "'Gowun Dodum', sans-serif",
          minHeight: "1.1em",
        }}
      >
        {label}
      </div>
      <div className="flex items-end gap-[3px]">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const isActive = i < step;
          const isCurrent = i === step - 1;
          return (
            <div
              key={i}
              style={{
                width: 28,
                height: 18 + i * 12,
                borderRadius: "5px 5px 0 0",
                background: isActive
                  ? isCurrent
                    ? color
                    : `${color}99`
                  : "oklch(0.22 0.04 280)",
                border: `1.5px solid ${isActive ? color : "oklch(0.30 0.05 280)"}`,
                transition: "all 0.3s ease",
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              {isCurrent && (
                <span
                  style={{
                    position: "absolute",
                    top: -22,
                    fontSize: "1.1rem",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                    animation: "bounceChar 0.6s ease-out",
                  }}
                >
                  {emoji}
                </span>
              )}
            </div>
          );
        })}
        {/* 정상 표시 */}
        <div
          style={{
            width: 28,
            height: 18 + TOTAL_STEPS * 12,
            borderRadius: "5px 5px 0 0",
            background: step >= TOTAL_STEPS ? color : "oklch(0.22 0.04 280)",
            border: `1.5px solid ${step >= TOTAL_STEPS ? color : "oklch(0.30 0.05 280)"}`,
            transition: "all 0.3s ease",
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          {step >= TOTAL_STEPS && (
            <span
              style={{
                position: "absolute",
                top: -22,
                fontSize: "1.1rem",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                animation: "bounceChar 0.6s ease-out",
              }}
            >
              {emoji}
            </span>
          )}
          <span
            style={{
              position: "absolute",
              top: -38,
              fontSize: "0.9rem",
            }}
          >
            🏔️
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 게임 컴포넌트 ──────────────────────────────────────────────────────
export default function Stage07RockPaperScissorsStairsGame({ stage, onComplete }: Props) {
  // ── 게임 상태 ──
  const [yeongseoStep, setYeongseoStep] = useState(0);
  const [jinseongStep, setJinseongStep] = useState(0);
  const [isYeongseoInvincible, setIsYeongseoInvincible] = useState(false);

  // ── UI 상태 ──
  const [started, setStarted] = useState(false);
  const [cleared, setCleared] = useState(false);

  // 현재 라운드 결과 표시
  const [yeongseoChoice, setYeongseoChoice] = useState<Choice | null>(null);
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 원망 메시지 (진성이 2칸 이상 앞설 때)
  const [showComplaintMsg, setShowComplaintMsg] = useState(false);
  const complaintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 특수 팝업 (jinseong_step == 4)
  const [showSpecialPopup, setShowSpecialPopup] = useState(false);
  const [popupBiteVisible, setPopupBiteVisible] = useState(false);

  // 결과 메시지 자동 초기화
  useEffect(() => {
    if (roundResult === null) return;
    const t = setTimeout(() => {
      setRoundResult(null);
      setResultMessage("");
      setYeongseoChoice(null);
      setUserChoice(null);
      setIsProcessing(false);
    }, 1400);
    return () => clearTimeout(t);
  }, [roundResult]);

  // 원망 메시지 자동 숨김
  useEffect(() => {
    if (!showComplaintMsg) return;
    if (complaintTimerRef.current) clearTimeout(complaintTimerRef.current);
    complaintTimerRef.current = setTimeout(() => setShowComplaintMsg(false), 2800);
    return () => {
      if (complaintTimerRef.current) clearTimeout(complaintTimerRef.current);
    };
  }, [showComplaintMsg]);

  // ── 게임 로직 ──
  const handleChoice = (choice: Choice) => {
    if (isProcessing || cleared || showSpecialPopup) return;

    setIsProcessing(true);
    setUserChoice(choice);

    // 영서의 패 결정 (무적 모드면 항상 이기는 패)
    const opponentChoice = isYeongseoInvincible
      ? getWinningChoice(choice)
      : getRandomChoice();

    setYeongseoChoice(opponentChoice);

    const result = judgeResult(choice, opponentChoice);
    setRoundResult(result);

    if (result === "draw") {
      setResultMessage("비겼습니다! 다시 내세요.");
      setIsProcessing(false);
      return;
    }

    if (result === "lose") {
      // 영서 승리 → 영서 전진
      const nextYeongseoStep = yeongseoStep + 1;
      setYeongseoStep(nextYeongseoStep);
      setResultMessage("영서가 한 칸 올라갔어요! 🎉");

      if (nextYeongseoStep >= TOTAL_STEPS) {
        setTimeout(() => setCleared(true), 900);
      }
    } else {
      // 진성 승리 → 진성 전진
      const nextJinseongStep = jinseongStep + 1;
      setJinseongStep(nextJinseongStep);
      setResultMessage("진성이가 한 칸 올라갔어요...");

      // 원망 메시지 조건: 진성이 영서보다 2칸 이상 앞설 때
      if (nextJinseongStep - yeongseoStep >= 2) {
        setShowComplaintMsg(true);
      }

      // 특수 이벤트: jinseong_step == 4
      if (nextJinseongStep === 4) {
        setTimeout(() => {
          setShowSpecialPopup(true);
        }, 800);
      }
    }
  };

  // 팝업 [아니오] → 깨물 이미지 표시 후 팝업 다시 노출
  const handlePopupNo = () => {
    setPopupBiteVisible(true);
    setTimeout(() => {
      setPopupBiteVisible(false);
    }, 1400);
  };

  // 팝업 [예] → 무적 모드 발동
  const handlePopupYes = () => {
    setShowSpecialPopup(false);
    setIsYeongseoInvincible(true);
    setIsProcessing(false);
  };

  // 게임 리셋
  const resetGame = () => {
    setYeongseoStep(0);
    setJinseongStep(0);
    setIsYeongseoInvincible(false);
    setStarted(false);
    setCleared(false);
    setYeongseoChoice(null);
    setUserChoice(null);
    setRoundResult(null);
    setResultMessage("");
    setIsProcessing(false);
    setShowComplaintMsg(false);
    setShowSpecialPopup(false);
    setPopupBiteVisible(false);
  };

  // 영서 이미지 결정
  const yeongseoImg =
    yeongseoStep >= jinseongStep ? IMG_YEONGSEO_WIN : IMG_YEONGSEO_LOSE;

  // ── 렌더 ──
  return (
    <GameLayout
      stage={stage}
      score={yeongseoStep}
      maxScore={TOTAL_STEPS}
      hintText="눈치껏 져줘야 해! 영서가 먼저 정상에 오를 수 있도록 가위바위보를 잘 골라봐 😉"
      showProgress={false}
    >
      {/* ── 시작 화면 ── */}
      {!started && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            style={{
              background: "oklch(0.13 0.04 280 / 0.88)",
              border: "1.5px solid oklch(0.78 0.14 55 / 0.45)",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 8 }}>🏔️</div>
            <h2
              style={{
                color: "oklch(0.88 0.12 55)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "1.3rem",
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              칠갑산 가위바위보
            </h2>
            <p
              style={{
                color: "oklch(0.85 0.05 60)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              영서가 먼저 정상에 오를 수 있도록<br />
              <strong style={{ color: "oklch(0.88 0.14 55)" }}>눈치껏 져줘야 해!</strong><br />
              총 5칸의 계단을 올라 정상에 도착하자.
            </p>
            <button
              className="btn-star"
              onClick={() => setStarted(true)}
              style={{ width: "100%" }}
            >
              시작하기 ✊
            </button>
          </div>
        </div>
      )}

      {/* ── 게임 화면 ── */}
      {started && !cleared && (
        <div className="flex-1 flex flex-col items-center px-3 py-3 gap-3 relative">

          {/* 캐릭터 영역 */}
          <div className="flex items-end justify-center gap-6 w-full max-w-sm">
            {/* 영서 */}
            <div className="flex flex-col items-center gap-1 relative">
              {/* 영서 말풍선 (랜덤 패 또는 결과) */}
              {yeongseoChoice && (
                <div
                  style={{
                    background: "oklch(0.18 0.05 280 / 0.92)",
                    border: "1.5px solid oklch(0.72 0.12 350 / 0.6)",
                    borderRadius: "12px 12px 12px 2px",
                    padding: "6px 12px",
                    fontSize: "1.3rem",
                    textAlign: "center",
                    marginBottom: 2,
                    animation: "popIn 0.25s ease-out",
                    minWidth: 52,
                  }}
                >
                  {CHOICE_EMOJI[yeongseoChoice]}
                </div>
              )}
              {/* 원망 말풍선 */}
              {showComplaintMsg && (
                <div
                  style={{
                    position: "absolute",
                    top: -52,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "oklch(0.20 0.06 20 / 0.95)",
                    border: "1.5px solid oklch(0.65 0.22 20 / 0.7)",
                    borderRadius: "10px 10px 10px 2px",
                    padding: "6px 10px",
                    fontSize: "0.72rem",
                    color: "oklch(0.95 0.05 60)",
                    fontFamily: "'Gowun Dodum', sans-serif",
                    whiteSpace: "nowrap",
                    animation: "popIn 0.25s ease-out",
                    zIndex: 10,
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  내가 너무 느려서<br />진성이 먼저 간다ㅜㅜ
                </div>
              )}
              <img
                src={yeongseoImg}
                alt="영서"
                style={{
                  width: "clamp(90px, 22vw, 130px)",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                  transition: "all 0.3s ease",
                }}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "oklch(0.80 0.10 350)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: "bold",
                }}
              >
                영서
              </span>
            </div>

            {/* VS */}
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "oklch(0.75 0.05 280)",
                fontFamily: "'Gowun Dodum', sans-serif",
                paddingBottom: 24,
              }}
            >
              VS
            </div>

            {/* 진성 */}
            <div className="flex flex-col items-center gap-1">
              {userChoice && (
                <div
                  style={{
                    background: "oklch(0.18 0.05 280 / 0.92)",
                    border: "1.5px solid oklch(0.78 0.14 55 / 0.6)",
                    borderRadius: "12px 12px 2px 12px",
                    padding: "6px 12px",
                    fontSize: "1.3rem",
                    textAlign: "center",
                    marginBottom: 2,
                    animation: "popIn 0.25s ease-out",
                    minWidth: 52,
                  }}
                >
                  {CHOICE_EMOJI[userChoice]}
                </div>
              )}
              <img
                src={IMG_JINSEONG}
                alt="진성"
                style={{
                  width: "clamp(90px, 22vw, 130px)",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                }}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "oklch(0.80 0.12 55)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontWeight: "bold",
                }}
              >
                진성
              </span>
            </div>
          </div>

          {/* 결과 메시지 */}
          <div
            style={{
              minHeight: 28,
              textAlign: "center",
              fontFamily: "'Gowun Dodum', sans-serif",
              fontSize: "0.88rem",
              color:
                roundResult === "lose"
                  ? "oklch(0.80 0.14 350)"
                  : roundResult === "win"
                  ? "oklch(0.80 0.12 55)"
                  : "oklch(0.80 0.05 280)",
              fontWeight: "bold",
              transition: "all 0.2s",
              animation: roundResult ? "popIn 0.2s ease-out" : "none",
            }}
          >
            {resultMessage}
          </div>

          {/* 계단 시각화 */}
          <div
            style={{
              display: "flex",
              gap: "clamp(16px, 6vw, 40px)",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "8px 16px",
              background: "oklch(0.12 0.04 280 / 0.7)",
              borderRadius: 16,
              border: "1px solid oklch(0.30 0.05 280)",
              width: "100%",
              maxWidth: 360,
            }}
          >
            <StairTrack
              step={yeongseoStep}
              color="oklch(0.72 0.12 350)"
              label="영서"
              emoji="🧡"
            />
            <StairTrack
              step={jinseongStep}
              color="oklch(0.78 0.14 55)"
              label="진성"
              emoji="💛"
            />
          </div>

          {/* 진행 상황 텍스트 */}
          <div
            style={{
              fontSize: "0.78rem",
              color: "oklch(0.70 0.05 280)",
              fontFamily: "'Gowun Dodum', sans-serif",
              textAlign: "center",
            }}
          >
            영서 {yeongseoStep}/{TOTAL_STEPS}칸 · 진성 {jinseongStep}/{TOTAL_STEPS}칸
            {isYeongseoInvincible && (
              <span style={{ color: "oklch(0.80 0.14 350)", marginLeft: 8 }}>
                ✨ 영서 무적 모드!
              </span>
            )}
          </div>

          {/* 가위바위보 버튼 */}
          <div className="flex gap-3 justify-center mt-1">
            {(["가위", "바위", "보"] as Choice[]).map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={isProcessing || showSpecialPopup}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1.5px solid oklch(0.78 0.14 55 / 0.5)",
                  background:
                    isProcessing || showSpecialPopup
                      ? "oklch(0.18 0.04 280 / 0.5)"
                      : "oklch(0.18 0.05 280 / 0.85)",
                  color: "oklch(0.90 0.05 60)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: "bold",
                  cursor: isProcessing || showSpecialPopup ? "not-allowed" : "pointer",
                  opacity: isProcessing || showSpecialPopup ? 0.5 : 1,
                  transition: "all 0.15s",
                  minWidth: 64,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing && !showSpecialPopup)
                    e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{CHOICE_EMOJI[choice]}</span>
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 클리어 화면 ── */}
      {cleared && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div
            style={{
              background: "oklch(0.13 0.04 280 / 0.92)",
              border: "2px solid oklch(0.78 0.14 55 / 0.6)",
              borderRadius: 24,
              padding: "36px 28px",
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 40px oklch(0.78 0.14 55 / 0.2)",
              animation: "popIn 0.4s ease-out",
            }}
          >
            {/* 두 캐릭터 함께 */}
            <div className="flex items-end justify-center gap-4 mb-4">
              <img
                src={IMG_YEONGSEO_WIN}
                alt="영서"
                style={{
                  width: "clamp(80px, 20vw, 110px)",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                }}
              />
              <img
                src={IMG_JINSEONG}
                alt="진성"
                style={{
                  width: "clamp(80px, 20vw, 110px)",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                }}
              />
            </div>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏔️🎉</div>
            <h2
              style={{
                color: "oklch(0.88 0.12 55)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "1.15rem",
                fontWeight: "bold",
                marginBottom: 10,
                lineHeight: 1.6,
              }}
            >
              영서와 진성이가 무사히<br />칠갑산 정상에 도착했습니다! 🎊
            </h2>
            <p
              style={{
                color: "oklch(0.80 0.05 60)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "0.85rem",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              힘든 등산도 함께라면 즐거워~<br />
              다음 추억으로 이어가자!
            </p>
            <button
              className="btn-star"
              onClick={onComplete}
              style={{ width: "100%", fontSize: "1rem" }}
            >
              다음 기억으로 →
            </button>
          </div>
        </div>
      )}

      {/* ── 특수 팝업 오버레이 (jinseong_step == 4) ── */}
      {showSpecialPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "oklch(0.05 0.02 280 / 0.80)",
            backdropFilter: "blur(4px)",
          }}
        >
          {/* 깨물 이미지 (아니오 클릭 시) */}
          {popupBiteVisible && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 70,
                pointerEvents: "none",
              }}
            >
              <img
                src={IMG_BITE}
                alt="깨물!"
                style={{
                  width: "clamp(180px, 45vw, 280px)",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 30px rgba(255,60,60,0.8))",
                  animation: "biteIn 0.3s ease-out",
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  background: "oklch(0.25 0.08 20 / 0.95)",
                  border: "2px solid oklch(0.65 0.22 20)",
                  borderRadius: "999px",
                  padding: "8px 24px",
                  color: "oklch(0.95 0.05 60)",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  fontFamily: "'Gowun Dodum', sans-serif",
                }}
              >
                깨물어버릴 거야! 😤
              </div>
            </div>
          )}

          {/* 팝업 카드 */}
          <div
            style={{
              background: "oklch(0.15 0.05 280 / 0.97)",
              border: "2px solid oklch(0.78 0.14 55 / 0.55)",
              borderRadius: 22,
              padding: "32px 28px",
              maxWidth: 320,
              width: "calc(100% - 40px)",
              textAlign: "center",
              boxShadow: "0 16px 56px rgba(0,0,0,0.55), 0 0 40px oklch(0.78 0.14 55 / 0.15)",
              animation: "popIn 0.35s ease-out",
              position: "relative",
              zIndex: 65,
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>⚠️</div>
            <h3
              style={{
                color: "oklch(0.92 0.10 55)",
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: "1.1rem",
                fontWeight: "bold",
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              영서를 두고<br />정상에 오르시겠습니까?
            </h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handlePopupYes}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "1.5px solid oklch(0.78 0.14 55 / 0.6)",
                  background: "oklch(0.22 0.06 55 / 0.8)",
                  color: "oklch(0.90 0.10 55)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                예
              </button>
              <button
                onClick={handlePopupNo}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "1.5px solid oklch(0.72 0.12 350 / 0.6)",
                  background: "oklch(0.22 0.06 350 / 0.8)",
                  color: "oklch(0.90 0.10 350)",
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 애니메이션 스타일 ── */}
      <style>{`
        @keyframes bounceChar {
          0% { transform: translateY(-8px) scale(0.8); opacity: 0; }
          60% { transform: translateY(2px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.75); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes biteIn {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </GameLayout>
  );
}
