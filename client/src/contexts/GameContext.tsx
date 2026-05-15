import { createContext, useContext, useState, useCallback } from "react";

export interface StageInfo {
  id: number;
  name: string;
  date: string;
  emoji: string;
  bg: string;
  caricature?: string;
  gameType: StageGameType;
  description: string;
  intro: string;
  outroTitle: string;
  outroDescription: string;
  lat: number;
  lng: number;
}

export type StageGameType =
  | "tasteQuiz"
  | "heartClick"
  | "everlandDodge"
  | "puzzle"
  | "scratchOff"
  | "spotDifference"
  | "rpsStairs"
  | "recognizedPersonQuiz"
  | "sortBreadRing"
  | "samePhotoMatch"
  | "dinoRun"
  | "baseball";

// 12개 스테이지 (날짜순)
export const STAGES: StageInfo[] = [
  {
    id: 1,
    name: "합정 소개팅",
    date: "2025.01.17",
    emoji: "☕",
    bg: "/webdev-static-assets/stage1-hapjeong.png",
    caricature: "/webdev-static-assets/caricature-hapjeong-v2.png",
    gameType: "tasteQuiz",
    description: "스케쥴합정에서의 첫 만남",
    intro: "첫 소개팅에서 만난 진성이와 영서! 과연 진성이는 영서의 취향을 잘 파악할 수 있을까?",
    outroTitle: "소개팅 성공! 💕",
    outroDescription: "진성이가 영서 취향을 잘 파악했네 🥰",
    lat: 37.549,
    lng: 126.914,
  },
  {
    id: 2,
    name: "시청 고백",
    date: "2025.03.03",
    emoji: "💑",
    bg: "/webdev-static-assets/stage2-cityhall-new.png",
    caricature: "/webdev-static-assets/caricature-cityhall-v2.png",
    gameType: "heartClick",
    description: "드디어 사귀게 된 날",
    intro: "데이트는 많이 했는데.. 우리 무슨 사이야?!",
    outroTitle: "정확히 기억하고 있군! 🎉",
    outroDescription: "총 7번 만나고 사귀기로 했지 💕",
    lat: 37.566,
    lng: 126.977,
  },
  {
    id: 3,
    name: "에버랜드",
    date: "2025.05.26",
    emoji: "🎢",
    bg: "/webdev-static-assets/stage3-everland.png",
    caricature: "/webdev-static-assets/caricature-everland.png",
    gameType: "everlandDodge",
    description: "에버랜드 데이트",
    intro: "회사로부터 도망치자! 사실 피해야 할 건 회사 연락만이 아닐지도?!",
    outroTitle: "20초 생존 성공! 🎢",
    outroDescription: "회사 연락도, 무서운 놀이기구도 무사히 피했어! 고생했군 💕",
    lat: 37.294,
    lng: 127.202,
  },
  {
    id: 4,
    name: "제주도",
    date: "2025.06.05",
    emoji: "🍊",
    bg: "/webdev-static-assets/stage4-jeju.png",
    caricature: "/webdev-static-assets/caricature-jeju.png",
    gameType: "puzzle",
    description: "제주도 여행",
    intro: "우리의 첫 여행은 제주도~ 피곤했지만 진짜 즐거웠어💕 ",
    outroTitle: "제주도 퍼즐 완성! 🍊",
    outroDescription: "첫 여행의 마지막 순간 사진! 너무너무 재미있었지? ",
    lat: 33.489,
    lng: 126.498,
  },
  {
    id: 5,
    name: "코엑스 아쿠아리움",
    date: "2025.07.13",
    emoji: "🐠",
    bg: "/webdev-static-assets/stage5-aquarium-new.png",
    caricature: "/webdev-static-assets/caricature-coex.png",
    gameType: "spotDifference",
    description: "코엑스 아쿠아리움 데이트",
    intro: "첫 아쿠아리움 데이트! 수조 속에 숨겨진 달라진 조각들을 찾아보자 🐠",
    outroTitle: "아쿠아리움 추억찾기 성공! 🐠",
    outroDescription: "진성 눈썰미가 좋은걸?!",
    lat: 37.513,
    lng: 127.059,
  },
  {
    id: 6,
    name: "포항 & 영덕",
    date: "2025.08.22",
    emoji: "🌊",
    bg: "/webdev-static-assets/stage6-pohang-new.png",
    caricature: "/webdev-static-assets/caricature-pohang.png",
    gameType: "scratchOff",
    description: "포항·영덕 여행",
    intro: "바다와 맛있는 음식이 함께했던 포항·영덕 여행! 복권 아래 숨겨진 추억을 꺼내보자",
    outroTitle: "추억 복원 완료! 🌊",
    outroDescription: "나랑 앞으로도 계속 바다 보러 가 줄거지?",
    lat: 36.019,
    lng: 129.343,
  },
  {
    id: 7,
    name: "칠갑산",
    date: "2025.10.11",
    emoji: "🏔️",
    bg: "/webdev-static-assets/stage7-chilgapsan.png",
    caricature: "/webdev-static-assets/caricature-chilgap.png",
    gameType: "rpsStairs",
    description: "칠갑산 단풍 등산",
    intro: "가벼운 등산이라며… 초보자도 갈 수 있다며!ㅠㅠㅠ",
    outroTitle: "칠갑산 정상 도착! 🏔️",
    outroDescription: "힘든 등산도 진성이와 함께라면 즐거워~ 또 등산 가자!ㅎㅎ..",
    lat: 36.337,
    lng: 126.882,
  },
  {
    id: 8,
    name: "올림픽공원 GMF",
    date: "2025.10.18",
    emoji: "🎵",
    bg: "/webdev-static-assets/stage8-olympicpark.png",
    caricature: "/webdev-static-assets/caricature-festival.png",
    gameType: "recognizedPersonQuiz",
    description: "그랜드민트페스티벌",
    intro: "처음으로 간 페스티벌! 진성이는 본인도 모르는 사이 영서 친구들에게 유명인사가 되어 있었다?!",
    outroTitle: "모의고사 통과! 🎉",
    outroDescription: "훌륭해! 이제 영서 친구들 앞에서도 당당한 진성이 😎",
    lat: 37.521,
    lng: 127.124,
  },
  {
    id: 9,
    name: "대전 1주년",
    date: "2026.03.01",
    emoji: "💍",
    bg: "/webdev-static-assets/stage9-daejeon-new.png",
    caricature: "/webdev-static-assets/caricature-ring.png",
    gameType: "sortBreadRing",
    description: "성심당 딸기요거롤 & 커플링",
    intro: "1주년 기념 데이트! 고대하던 딸기요거롤도 먹고 반지도 예쁘게 만들어서 행복해진 영서~",
    outroTitle: "분류 완료! 🧺",
    outroDescription: "딸기 요거롤 하나 더 사올걸~ 🍰",
    lat: 36.351,
    lng: 127.385,
  },
  {
    id: 10,
    name: "양재천 벚꽃스냅",
    date: "2026.04.04",
    emoji: "🌸",
    bg: "/webdev-static-assets/stage9-cherry-new.png",
    caricature: "/webdev-static-assets/caricature-cherry.png",
    gameType: "samePhotoMatch",
    description: "양재천 벚꽃 스냅 촬영",
    intro: "작가님이 인정한 공식 I커플:) 갑분 기억력 테스트 시작",
    outroTitle: "기억력 테스트 통과! 🎉",
    outroDescription: "모든 사진의 짝을 완벽하게 맞췄어! 👀",
    lat: 37.467,
    lng: 127.039,
  },
  {
    id: 11,
    name: "보성 녹차마라톤",
    date: "2026.05.02",
    emoji: "🍵",
    bg: "/webdev-static-assets/stage10-boseong-new.png",
    caricature: "/webdev-static-assets/caricature-greentea.png",
    gameType: "dinoRun",
    description: "보성 녹차마라톤",
    intro: "영서는 10km, 진성이는 42km! 도합 52km! 열심히 뛰어보자~",
    outroTitle: "완주 성공! 🏃‍♂️💨",
    outroDescription: "힘들었지만 마라톤도 재미있고, 광주 여행도 즐거웠지!",
    lat: 34.771,
    lng: 127.080,
  },
  {
    id: 12,
    name: "잠실 야구장",
    date: "2026.05.05",
    emoji: "⚾",
    bg: "/webdev-static-assets/stage11-baseball-new.png",
    caricature: "/webdev-static-assets/caricature-baseball.png",
    gameType: "baseball",
    description: "두산 베어스 직관",
    intro: "마지막 클라이맥스! 날아오는 야구공을 타이밍 맞춰 홈런으로 날려보자",
    outroTitle: "한국시리즈 직관 성공! ⚾️",
    outroDescription: "1차전 승리의 직관 요정이 된 걸 환영해! 🧚",
    lat: 37.512,
    lng: 127.072,
  },
];

interface GameContextType {
  completedStages: number[];
  currentStage: number;
  mapSolved: boolean;
  quizCompleted: boolean;
  completeStage: (id: number) => void;
  setCurrentStage: (id: number) => void;
  solveMap: () => void;
  completeQuiz: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [mapSolved, setMapSolved] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const completeStage = useCallback((id: number) => {
    setCompletedStages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCurrentStage(id + 1);
  }, []);

  const solveMap = useCallback(() => setMapSolved(true), []);
  const completeQuiz = useCallback(() => setQuizCompleted(true), []);

  const resetGame = useCallback(() => {
    setCompletedStages([]);
    setCurrentStage(1);
    setMapSolved(false);
    setQuizCompleted(false);
  }, []);

  return (
    <GameContext.Provider
      value={{
        completedStages,
        currentStage,
        mapSolved,
        quizCompleted,
        completeStage,
        setCurrentStage,
        solveMap,
        completeQuiz,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
