/*
 * Stage 8 - 그민페: 영서 친구 영역 모의고사
 * 
 * 디자인: 가을 밤 페스티벌 감성
 *   - 배경: 따뜻한 주황색 + 진한 밤하늘 파스텔 톤
 *   - UI: 반투명 카드 + 부드러운 그라디언트
 *   - 색상: 따뜻한 금색, 민트, 핑크 조화
 */
import { useState, useEffect } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

const ANSWER_QUIZ3 = "친구이름적기"; // TODO: 실제 친구 이름으로 변경

// 배열 섞기 유틸
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const QUIZ2_DATA: Record<string, string> = {
  "대연": "교회 친구",
  "희진": "초등학교 친구",
  "태호": "고등학교 친구",
  "이랑": "싸피 친구",
};

// 가을 페스티벌 팔레트
const GMF = {
  // 배경 - 따뜻한 톤
  bgDark: "#1a1a2e",      // 진한 밤하늘
  bgMid: "#2d2d44",       // 중간 톤
  bgWarm: "#3d3d5c",      // 따뜻한 톤
  // 강조 색상
  gold: "#f4d03f",        // 따뜻한 금색
  goldLight: "#fce181",   // 밝은 금색
  mint: "#a8d8d8",        // 부드러운 민트
  mintLight: "#d4f1f1",   // 밝은 민트
  pink: "#f4a6d3",        // 부드러운 핑크
  pinkLight: "#f8d7e8",   // 밝은 핑크
  orange: "#f4a261",      // 따뜻한 주황
  orangeLight: "#f8c4a0", // 밝은 주황
  // 텍스트
  textLight: "#f5f5f5",
  textMuted: "#b0b0c0",
};

export default function Stage08RecognizedPersonQuizGame({ stage, onComplete }: Props) {
  const [currentQuiz, setCurrentQuiz] = useState(1);
  const [cleared, setCleared] = useState(false);
  const [errorShake, setErrorShake] = useState("");
  const [showBite, setShowBite] = useState(false);

  const triggerBite = () => {
    setShowBite(true);
    setTimeout(() => setShowBite(false), 1500);
  };

  // ================= Quiz 1 =================
  const q1Options = ["민진", "서형", "가은", "지연"];
  const [q1Selected, setQ1Selected] = useState<string | null>(null);
  const [q1Status, setQ1Status] = useState<"idle" | "correct" | "wrong">("idle");

  const handleQ1 = (opt: string) => {
    if (q1Status === "correct") return;
    setQ1Selected(opt);
    
    if (opt === "가은") {
      setQ1Status("correct");
      setTimeout(() => {
        setCurrentQuiz(2);
      }, 1000);
    } else {
      setQ1Status("wrong");
      setErrorShake("q1");
      triggerBite();
      setTimeout(() => {
        setErrorShake("");
        setQ1Status("idle");
        setQ1Selected(null);
      }, 600);
    }
  };

  // ================= Quiz 2 =================
  const [q2Names, setQ2Names] = useState<string[]>([]);
  const [q2Relations, setQ2Relations] = useState<string[]>([]);
  const [selName, setSelName] = useState<string | null>(null);
  const [selRel, setSelRel] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // 마운트 시 한 번만 배열 섞기
  useEffect(() => {
    setQ2Names(shuffle(Object.keys(QUIZ2_DATA)));
    setQ2Relations(shuffle(Object.values(QUIZ2_DATA)));
  }, []);

  // 이름과 관계가 하나씩 선택되면 정답 여부 판별
  useEffect(() => {
    if (selName && selRel) {
      if (QUIZ2_DATA[selName] === selRel) {
        // 정답!
        setMatchedPairs((prev) => ({ ...prev, [selName]: selRel }));
        setSelName(null);
        setSelRel(null);
      } else {
        // 오답!
        setErrorShake("q2");
        triggerBite();
        setTimeout(() => {
          setSelName(null);
          setSelRel(null);
          setErrorShake("");
        }, 500);
      }
    }
  }, [selName, selRel]);

  // 모두 맞췄을 때 3단계로 이동
  useEffect(() => {
    if (currentQuiz === 2 && Object.keys(matchedPairs).length === 4) {
      setTimeout(() => {
        setCurrentQuiz(3);
      }, 800);
    }
  }, [matchedPairs, currentQuiz]);


  // ================= Quiz 3 =================
  const [q3Input, setQ3Input] = useState("");

  const handleQ3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = q3Input.trim();
    if (val === ANSWER_QUIZ3) {
      setCleared(true);
    } else {
      setErrorShake("q3");
      triggerBite();
      setTimeout(() => {
        setErrorShake("");
        setQ3Input("");
      }, 600);
    }
  };

  const score = cleared ? 3 : currentQuiz - 1;

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={3}
      hintText="영서 친구 영역 모의고사입니다. 3개의 문제를 모두 맞춰주세요!"
    >
      <div 
        className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full relative"
        style={{
          background: `linear-gradient(135deg, ${GMF.bgDark} 0%, ${GMF.bgMid} 50%, ${GMF.bgWarm} 100%)`,
        }}
      >
        
        {/* 헤더 타이틀 영역 (따뜻한 페스티벌 느낌) */}
        {!cleared && (
          <div 
            className="text-center mb-6 max-w-sm w-full p-5 rounded-2xl backdrop-blur-sm border-2"
            style={{
              background: `linear-gradient(135deg, rgba(244, 160, 97, 0.15) 0%, rgba(168, 216, 216, 0.1) 100%)`,
              borderColor: GMF.goldLight,
              boxShadow: `0 8px 24px rgba(244, 208, 63, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)`,
            }}
          >
            <h2 
              className="text-2xl font-black mb-2"
              style={{ color: GMF.goldLight }}
            >
              🎤 Stage 8: 그민페
            </h2>
            <p className="text-[0.9rem] font-bold leading-snug mb-2" style={{ color: GMF.mintLight }}>
              처음으로 간 페스티벌!<br/>진성이는 영서 친구들에게 유명인사가 되어버렸다?!
            </p>
            <p className="text-xs" style={{ color: GMF.textMuted }}>
              진성이를 알아보는 친구들을 피해 다니려면<br/>영서 친구들도 잘 알아둬야겠지!?
            </p>
          </div>
        )}

        {/* ── [Quiz 1] 객관식 ── */}
        {currentQuiz === 1 && !cleared && (
          <div className={`w-full max-w-sm flex flex-col items-center animate-fade-in ${errorShake === "q1" ? "animate-custom-shake" : ""}`}>
            <div 
              className="p-6 rounded-2xl border-2 w-full shadow-lg backdrop-blur-md"
              style={{
                background: `linear-gradient(135deg, rgba(244, 160, 97, 0.2) 0%, rgba(168, 216, 216, 0.15) 100%)`,
                borderColor: GMF.orange,
                boxShadow: `0 8px 24px rgba(244, 160, 97, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)`,
              }}
            >
              <span 
                className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-3"
                style={{ background: GMF.orange }}
              >
                Quiz 1
              </span>
              <p className="font-bold text-lg mb-5 leading-relaxed" style={{ color: GMF.textLight }}>
                그민페에서 맥주 사러 뛰어가는<br/>진성이를 알아본 친구의 이름은?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {q1Options.map((opt) => {
                  const isSelected = q1Selected === opt;
                  let bgColor = `rgba(168, 216, 216, 0.15)`;
                  let borderColor = GMF.mint;
                  let textColor = GMF.textLight;
                  
                  if (isSelected) {
                    if (q1Status === "correct") {
                      bgColor = GMF.mint;
                      borderColor = GMF.mintLight;
                      textColor = GMF.bgDark;
                      textColor = "#1a1a2e";
                    } else if (q1Status === "wrong") {
                      bgColor = `rgba(244, 106, 106, 0.8)`;
                      borderColor = "#f46a6a";
                      textColor = GMF.textLight;
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleQ1(opt)}
                      className="py-3 rounded-xl border-2 font-bold text-base transition-all duration-200"
                      style={{
                        background: bgColor,
                        borderColor: borderColor,
                        color: textColor,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {q1Status === "wrong" && (
                <p className="font-bold mt-4 animate-bounce text-center" style={{ color: GMF.pink }}>
                  땡! 다시 생각해 봐!
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── [Quiz 2] 짝 맞추기 ── */}
        {currentQuiz === 2 && !cleared && (
          <div className={`w-full max-w-md flex flex-col items-center animate-fade-in ${errorShake === "q2" ? "animate-custom-shake" : ""}`}>
            <div 
              className="p-6 rounded-2xl border-2 w-full shadow-lg backdrop-blur-md"
              style={{
                background: `linear-gradient(135deg, rgba(244, 160, 97, 0.2) 0%, rgba(168, 216, 216, 0.15) 100%)`,
                borderColor: GMF.mint,
                boxShadow: `0 8px 24px rgba(168, 216, 216, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span 
                  className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: GMF.mint }}
                >
                  Quiz 2
                </span>
                <span className="text-xs font-bold" style={{ color: GMF.mintLight }}>
                  {Object.keys(matchedPairs).length} / 4 완료
                </span>
              </div>
              <p className="font-bold text-base mb-5 leading-relaxed text-center" style={{ color: GMF.textLight }}>
                다음 이름을 보고<br/>알맞은 관계와 이으시오.
              </p>
              
              <div className="flex justify-between gap-4">
                {/* 이름 목록 */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-center text-xs font-bold mb-1" style={{ color: GMF.textMuted }}>
                    이름
                  </div>
                  {q2Names.map((name) => {
                    const isMatched = !!matchedPairs[name];
                    const isSelected = selName === name;
                    let bgColor = `rgba(168, 216, 216, 0.15)`;
                    let borderColor = GMF.mint;
                    let textColor = GMF.textLight;
                    
                    if (isMatched) {
                      bgColor = `rgba(168, 216, 216, 0.3)`;
                      borderColor = GMF.mint;
                      textColor = GMF.mintLight;
                    } else if (isSelected) {
                      bgColor = GMF.mint;
                      borderColor = GMF.mintLight;
                      textColor = GMF.bgDark;
                    }

                    return (
                      <button
                        key={name}
                        disabled={isMatched}
                        onClick={() => setSelName(name)}
                        className="py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all duration-200"
                        style={{
                          background: bgColor,
                          borderColor: borderColor,
                          color: textColor,
                          opacity: isMatched ? 0.6 : 1,
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                
                {/* 관계 목록 */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-center text-xs font-bold mb-1" style={{ color: GMF.textMuted }}>
                    관계
                  </div>
                  {q2Relations.map((rel) => {
                    const isMatched = Object.values(matchedPairs).includes(rel);
                    const isSelected = selRel === rel;
                    let bgColor = `rgba(244, 160, 97, 0.15)`;
                    let borderColor = GMF.orange;
                    let textColor = GMF.textLight;
                    
                    if (isMatched) {
                      bgColor = `rgba(244, 160, 97, 0.3)`;
                      borderColor = GMF.orange;
                      textColor = GMF.orangeLight;
                    } else if (isSelected) {
                      bgColor = GMF.orange;
                      borderColor = GMF.orangeLight;
                      textColor = GMF.bgDark;
                    }

                    return (
                      <button
                        key={rel}
                        disabled={isMatched}
                        onClick={() => setSelRel(rel)}
                        className="py-2 px-1 rounded-xl border-2 font-bold text-[0.8rem] break-keep transition-all duration-200"
                        style={{
                          background: bgColor,
                          borderColor: borderColor,
                          color: textColor,
                          opacity: isMatched ? 0.6 : 1,
                        }}
                      >
                        {rel}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs mt-5 text-center py-2 rounded-lg" style={{ color: GMF.textMuted, background: "rgba(0, 0, 0, 0.2)" }}>
                👆 양쪽 버튼을 각각 터치해서 짝을 맞추세요!
              </p>
            </div>
          </div>
        )}

        {/* ── [Quiz 3] 주관식 사진 ── */}
        {currentQuiz === 3 && !cleared && (
          <div className={`w-full max-w-sm flex flex-col items-center animate-fade-in ${errorShake === "q3" ? "animate-custom-shake" : ""}`}>
            <div 
              className="p-6 rounded-2xl border-2 w-full shadow-lg backdrop-blur-md"
              style={{
                background: `linear-gradient(135deg, rgba(244, 160, 97, 0.2) 0%, rgba(168, 216, 216, 0.15) 100%)`,
                borderColor: GMF.pink,
                boxShadow: `0 8px 24px rgba(244, 166, 211, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)`,
              }}
            >
              <span 
                className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-3"
                style={{ background: GMF.pink }}
              >
                Quiz 3
              </span>
              <p className="font-bold text-lg mb-4 text-center" style={{ color: GMF.textLight }}>
                다음 친구의 이름은 무엇인가요?
              </p>
              
              <div 
                className="w-full aspect-square rounded-xl overflow-hidden border-2 mb-5 flex items-center justify-center relative shadow-inner"
                style={{
                  background: `rgba(0, 0, 0, 0.3)`,
                  borderColor: GMF.pink,
                }}
              >
                <img 
                  src="/webdev-static-assets/stage8-friend-photo.png" 
                  alt="Friend Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const div = document.createElement('div');
                    div.className = "flex flex-col items-center justify-center h-full w-full";
                    div.style.color = GMF.textMuted;
                    div.innerHTML = `<span style='font-size: 3rem; margin-bottom: 8px;'>📸</span><span class='font-bold text-sm'>친구 사진 (준비중)</span>`;
                    e.currentTarget.parentElement?.appendChild(div);
                  }}
                />
              </div>

              <form onSubmit={handleQ3Submit} className="flex gap-2">
                <input 
                  type="text"
                  value={q3Input}
                  onChange={e => setQ3Input(e.target.value)}
                  placeholder="이름 입력..."
                  className="flex-1 border-2 rounded-xl px-4 py-2 font-bold transition-colors"
                  style={{
                    background: `rgba(0, 0, 0, 0.2)`,
                    borderColor: GMF.pink,
                    color: GMF.textLight,
                  }}
                />
                <button 
                  type="submit" 
                  className="text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg"
                  style={{
                    background: GMF.pink,
                  }}
                >
                  제출
                </button>
              </form>
              {errorShake === "q3" && (
                <p className="font-bold mt-3 animate-bounce text-center" style={{ color: GMF.pink }}>
                  오답입니다! 다시 잘 보세요!
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 클리어 화면 ── */}
        {cleared && (
          <div 
            className="w-full max-w-sm flex flex-col items-center p-8 rounded-3xl border-2 shadow-lg backdrop-blur-md text-center animate-pop-in"
            style={{
              background: `linear-gradient(135deg, rgba(168, 216, 216, 0.2) 0%, rgba(244, 160, 97, 0.15) 100%)`,
              borderColor: GMF.mint,
              boxShadow: `0 0 40px rgba(168, 216, 216, 0.3)`,
            }}
          >
            <div className="text-6xl mb-5 drop-shadow-lg">😎✨</div>
            <h3 className="text-[1.35rem] font-black mb-3 leading-relaxed drop-shadow-md" style={{ color: GMF.textLight }}>
              완벽해!<br/>이제 영서 친구들 앞에서도<br/>당당한 진성이 😎
            </h3>
            <p className="text-sm font-bold mb-8 px-4 py-2 rounded-lg" style={{ color: GMF.mint, background: `rgba(168, 216, 216, 0.3)` }}>
              🎉 영서 친구 영역 모의고사 100점!
            </p>
            <button 
              className="btn-star w-full py-3 text-lg shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${GMF.mint}, ${GMF.mintLight})`,
                color: GMF.bgDark,
              }}
              onClick={onComplete}
            >
              다음 기억으로 →
            </button>
          </div>
        )}

        {/* ── 오답 시 깨물 캐릭터 등장 ── */}
        {showBite && (
          <div className="fixed bottom-0 right-4 z-50 animate-slide-up pointer-events-none">
            <img 
              src="/webdev-static-assets/caricature-bite.png" 
              alt="오답 깨물" 
              className="w-32 h-32 object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            />
          </div>
        )}

      </div>

      <style>{`
        @keyframes customShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-custom-shake {
          animation: customShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes popIn {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); opacity: 0; }
          15% { transform: translateY(0); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-slide-up {
          animation: slideUp 1.5s ease-in-out forwards;
        }
      `}</style>
    </GameLayout>
  );
}
