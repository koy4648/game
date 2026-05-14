/*
 * Stage 8 - 그민페: 영서 친구 영역 모의고사
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full relative">
        
        {/* 헤더 타이틀 영역 (페스티벌 느낌의 밝은 컬러) */}
        {!cleared && (
          <div className="text-center mb-6 max-w-sm w-full bg-black/70 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-black mb-2" style={{ color: "oklch(0.85 0.15 160)" }}>
              🎤 Stage 8: 그민페
            </h2>
            <p className="text-[0.85rem] font-bold leading-snug mb-2" style={{ color: "oklch(0.95 0.05 180)" }}>
              처음으로 간 페스티벌!<br/>진성이는 영서 친구들에게 유명인사가 되어버렸다?!
            </p>
            <p className="text-xs opacity-90" style={{ color: "oklch(0.8 0.1 140)" }}>
              진성이를 알아보는 친구들을 피해 다니려면<br/>영서 친구들도 잘 알아둬야겠지!?
            </p>
          </div>
        )}

        {/* ── [Quiz 1] 객관식 ── */}
        {currentQuiz === 1 && !cleared && (
          <div className={`w-full max-w-sm flex flex-col items-center animate-fade-in ${errorShake === "q1" ? "animate-custom-shake" : ""}`}>
            <div className="bg-black/60 p-6 rounded-2xl border border-white/20 w-full shadow-lg backdrop-blur-md">
              <span className="inline-block bg-emerald-500/80 text-white text-xs font-bold px-2 py-1 rounded-full mb-3">Quiz 1</span>
              <p className="font-bold text-lg mb-5 text-white leading-relaxed">
                그민페에서 맥주 사러 뛰어가는<br/>진성이를 알아본 친구의 이름은?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {q1Options.map((opt) => {
                  const isSelected = q1Selected === opt;
                  let btnClass = "bg-white/10 border-white/20 text-white hover:bg-white/20";
                  
                  if (isSelected) {
                    if (q1Status === "correct") {
                      btnClass = "bg-emerald-500/90 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.6)]";
                    } else if (q1Status === "wrong") {
                      btnClass = "bg-rose-500/90 border-rose-400 text-white";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleQ1(opt)}
                      className={`py-3 rounded-xl border-2 font-bold text-base transition-all duration-200 ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {q1Status === "wrong" && (
                <p className="text-rose-400 font-bold mt-4 animate-bounce text-center">땡! 다시 생각해 봐!</p>
              )}
            </div>
          </div>
        )}

        {/* ── [Quiz 2] 짝 맞추기 ── */}
        {currentQuiz === 2 && !cleared && (
          <div className={`w-full max-w-md flex flex-col items-center animate-fade-in ${errorShake === "q2" ? "animate-custom-shake" : ""}`}>
            <div className="bg-black/60 p-6 rounded-2xl border border-white/20 w-full shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block bg-cyan-500/80 text-white text-xs font-bold px-2 py-1 rounded-full">Quiz 2</span>
                <span className="text-xs font-bold text-cyan-200">{Object.keys(matchedPairs).length} / 4 완료</span>
              </div>
              <p className="font-bold text-base mb-5 text-white leading-relaxed text-center">
                다음 이름을 보고<br/>알맞은 관계와 이으시오.
              </p>
              
              <div className="flex justify-between gap-4">
                {/* 이름 목록 */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-center text-xs font-bold text-white/60 mb-1">이름</div>
                  {q2Names.map((name) => {
                    const isMatched = !!matchedPairs[name];
                    const isSelected = selName === name;
                    let btnClass = "bg-white/10 border-white/20 text-white hover:bg-white/20";
                    
                    if (isMatched) btnClass = "bg-emerald-500/30 border-emerald-500/50 text-emerald-200 opacity-60";
                    else if (isSelected) btnClass = "bg-cyan-500/90 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105";

                    return (
                      <button
                        key={name}
                        disabled={isMatched}
                        onClick={() => setSelName(name)}
                        className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${btnClass}`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                
                {/* 관계 목록 */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-center text-xs font-bold text-white/60 mb-1">관계</div>
                  {q2Relations.map((rel) => {
                    const isMatched = Object.values(matchedPairs).includes(rel);
                    const isSelected = selRel === rel;
                    let btnClass = "bg-white/10 border-white/20 text-white hover:bg-white/20";
                    
                    if (isMatched) btnClass = "bg-emerald-500/30 border-emerald-500/50 text-emerald-200 opacity-60";
                    else if (isSelected) btnClass = "bg-fuchsia-500/90 border-fuchsia-400 text-white shadow-[0_0_12px_rgba(217,70,239,0.6)] scale-105";

                    return (
                      <button
                        key={rel}
                        disabled={isMatched}
                        onClick={() => setSelRel(rel)}
                        className={`py-2 px-1 rounded-xl border-2 font-bold text-[0.8rem] break-keep transition-all duration-200 ${btnClass}`}
                      >
                        {rel}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-white/70 mt-5 text-center bg-black/20 py-2 rounded-lg">
                👆 양쪽 버튼을 각각 터치해서 짝을 맞추세요!
              </p>
            </div>
          </div>
        )}

        {/* ── [Quiz 3] 주관식 사진 ── */}
        {currentQuiz === 3 && !cleared && (
          <div className={`w-full max-w-sm flex flex-col items-center animate-fade-in ${errorShake === "q3" ? "animate-custom-shake" : ""}`}>
            <div className="bg-black/60 p-6 rounded-2xl border border-white/20 w-full shadow-lg backdrop-blur-md">
              <span className="inline-block bg-amber-500/80 text-white text-xs font-bold px-2 py-1 rounded-full mb-3">Quiz 3</span>
              <p className="font-bold text-lg mb-4 text-white text-center">
                다음 친구의 이름은 무엇인가요?
              </p>
              
              <div className="w-full aspect-square bg-black/40 rounded-xl overflow-hidden border-2 border-white/20 mb-5 flex items-center justify-center relative shadow-inner">
                <img 
                  src="/webdev-static-assets/stage8-friend-photo.png" 
                  alt="Friend Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const div = document.createElement('div');
                    div.className = "flex flex-col items-center justify-center text-white/70 h-full w-full bg-white/5";
                    div.innerHTML = "<span style='font-size: 3rem; margin-bottom: 8px;'>📸</span><span class='font-bold text-sm'>친구 사진 (준비중)</span>";
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
                  className="flex-1 bg-black/40 border-2 border-white/30 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 font-bold transition-colors"
                />
                <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg">
                  제출
                </button>
              </form>
              {errorShake === "q3" && (
                <p className="text-rose-400 font-bold mt-3 animate-bounce text-center">오답입니다! 다시 잘 보세요!</p>
              )}
            </div>
          </div>
        )}

        {/* ── 클리어 화면 ── */}
        {cleared && (
          <div className="w-full max-w-sm flex flex-col items-center bg-black/40 p-8 rounded-3xl border-2 border-emerald-400/60 shadow-[0_0_40px_rgba(52,211,153,0.3)] backdrop-blur-md text-center animate-pop-in">
            <div className="text-6xl mb-5 drop-shadow-lg">😎✨</div>
            <h3 className="text-[1.35rem] font-black text-white mb-3 leading-relaxed drop-shadow-md">
              완벽해!<br/>이제 영서 친구들 앞에서도<br/>당당한 진성이 😎
            </h3>
            <p className="text-sm font-bold text-emerald-300 mb-8 px-4 py-2 bg-emerald-500/20 rounded-lg">
              🎉 영서 친구 영역 모의고사 100점!
            </p>
            <button className="btn-star w-full py-3 text-lg shadow-[0_4px_20px_rgba(0,0,0,0.4)]" onClick={onComplete}>
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
