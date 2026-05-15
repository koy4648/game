/*
 * Stage 11 - 보성 녹차마라톤: 귀여운 파스텔 픽셀 아트 달리기 게임
 *
 * 디자인: 아기자기 파스텔 도트 × 보성 녹차밭
 *   - 파스텔 민트/연두/하늘/핑크 팔레트
 *   - 배경: 하늘 → 구름 → 원거리 산 → 중거리 나무 → 녹차밭 → 꽃밭 → 길
 *   - 장식: 나비, 꽃, 작은 농가, 찻잎 파티클, 무지개
 *   - 캐릭터: 동글동글 귀여운 도트 러너
 *   - HUD: 파스텔 라운드 박스, 별/하트 아이콘
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StageInfo } from "@/contexts/GameContext";
import GameLayout from "./GameLayout";

interface Props {
  stage: StageInfo;
  onComplete: () => void;
}

type GameStatus = "idle" | "playing" | "gameover" | "step_clear" | "cleared";
type SpawnType  = "obstacle" | "item";

interface Sprite { id: number; x: number; type: SpawnType; }
interface FloatEffect { id: number; text: string; x: number; y: number; life: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

// ── 캔버스 해상도 (저해상도 → CSS 업스케일) ──────────────────────────────────
const PX  = 3;    // 1도트 = 3px
const CW  = 256;  // 캔버스 너비 (도트)
const CH  = 88;   // 캔버스 높이 (도트)
const GY  = 62;   // 바닥 y

const PLW = 13;   // 플레이어 너비
const PLH = 16;   // 플레이어 높이
const PLX = 24;   // 플레이어 x

const OBW = 11;   // 장애물
const OBH = 11;
const ITW = 9;    // 아이템
const ITH = 9;

const GRAVITY  = 0.22;
const JUMP_VY  = -5.0;
const MAX_FALL = 5.2;

const STEP1_TARGET = 10000;
const STEP2_TARGET = 42195;
const GEL_BONUS    = 500;
const MAX_LIVES    = 3;
const INVINCIBLE_MS = 1500;

const STEP_CONFIG = {
  1: { scrollSpeed: 1.4, spawnInterval: 92, itemChance: 0.28, scorePerFrame: 3 },
  2: { scrollSpeed: 1.9, spawnInterval: 74, itemChance: 0.30, scorePerFrame: 4 },
} as const;

const IMG_YEONGSEO = "/webdev-static-assets/caricature-run-yeongseo.png";
const IMG_JINSEONG  = "/webdev-static-assets/caricature-run-jinseong.png";
const IMG_OBSTACLE  = "/webdev-static-assets/obstacle-bush.png";
const IMG_GEL       = "/webdev-static-assets/item-energy-gel.png";

// ── 파스텔 귀여운 팔레트 ──────────────────────────────────────────────────────
const P = {
  // 하늘
  skyT:  "#c8eeff",  // 연하늘 상단
  skyB:  "#e8f8ff",  // 연하늘 하단
  cloud: "#ffffff",
  cloudS:"#d8f0ff",  // 구름 그림자
  // 무지개
  r1:"#ffb3b3", r2:"#ffd9b3", r3:"#fffbb3",
  r4:"#b3ffb3", r5:"#b3e8ff", r6:"#d4b3ff",
  // 원거리 산
  mtn1:  "#b8ddb0",  // 연한 민트 산
  mtn2:  "#cceec4",
  mtn3:  "#ddf5d8",
  // 중거리 나무
  tree1: "#5cb85c",  // 나무 진한
  tree2: "#7dd87d",  // 나무 밝은
  tree3: "#a8f0a8",  // 나무 연한
  treeT: "#8b5e3c",  // 나무 기둥
  // 녹차밭
  tea1:  "#4caf50",
  tea2:  "#66bb6a",
  tea3:  "#81c784",
  tea4:  "#a5d6a7",
  tea5:  "#c8e6c9",  // 가장 연한
  // 꽃
  fl1:   "#ff8fab",  // 핑크 꽃
  fl2:   "#ffb3c6",
  fl3:   "#ffd6e0",
  fl4:   "#fff0f3",
  flY:   "#ffe066",  // 노란 꽃
  flW:   "#ffffff",  // 흰 꽃
  // 길
  path:  "#f5e6c8",  // 파스텔 황토
  pathD: "#e8d4a8",
  pathL: "#fdf3e0",
  // 농가
  roof:  "#ff8a80",  // 파스텔 빨간 지붕
  wall:  "#fff9c4",  // 파스텔 노란 벽
  win:   "#b3e5fc",  // 창문
  door:  "#a5d6a7",  // 문
  // UI
  uiBg:  "#f0faf0",
  uiBd:  "#66bb6a",
  uiTxt: "#2e7d32",
  uiGold:"#f9a825",
  uiPink:"#f06292",
  uiBlue:"#42a5f5",
  uiRed: "#ef5350",
  // 기타
  white: "#ffffff",
  black: "#333333",
  shadow:"rgba(0,0,0,0.12)",
  // 나비
  bt1:   "#ce93d8",  // 보라 나비
  bt2:   "#f48fb1",  // 핑크 나비
  bt3:   "#80deea",  // 민트 나비
};

// ── 도트 헬퍼 ────────────────────────────────────────────────────────────────
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function pixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 5, align: CanvasTextAlign = "left") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.imageSmoothingEnabled = false;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── 배경 레이어 드로우 함수들 ─────────────────────────────────────────────────

// 1. 하늘 (파스텔 그라디언트)
function drawSky(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < GY; y++) {
    const t = y / GY;
    // 연하늘 → 더 연한 하늘
    const r = Math.round(200 + t * 32);
    const g = Math.round(230 + t * 24);
    const b = Math.round(255);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, CW, 1);
  }
}

// 2. 무지개 (Step1 배경 장식)
function drawRainbow(ctx: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha * 0.35;
  const cx = CW * 0.72, cy = GY + 4;
  const colors = [P.r1, P.r2, P.r3, P.r4, P.r5, P.r6];
  for (let i = 0; i < colors.length; i++) {
    const r = 28 + i * 5;
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 3. 구름 (픽셀 도트, 다양한 크기)
const CLOUDS = [
  { ox: 20,  y: 5,  w: 22, h: 7,  speed: 0.12 },
  { ox: 80,  y: 9,  w: 16, h: 5,  speed: 0.09 },
  { ox: 140, y: 4,  w: 28, h: 8,  speed: 0.14 },
  { ox: 200, y: 11, w: 14, h: 4,  speed: 0.10 },
  { ox: 60,  y: 14, w: 12, h: 4,  speed: 0.08 },
  { ox: 170, y: 16, w: 18, h: 5,  speed: 0.11 },
];

function drawClouds(ctx: CanvasRenderingContext2D, frame: number) {
  for (const cl of CLOUDS) {
    const cx = ((cl.ox + frame * cl.speed) % (CW + cl.w + 10));
    const x  = cx > CW + 5 ? cx - CW - cl.w - 10 : cx;
    // 구름 도트 패턴 (동글동글)
    dot(ctx, x,         cl.y + 2, P.cloudS, cl.w,     cl.h - 2);
    dot(ctx, x,         cl.y + 2, P.cloud,  cl.w,     cl.h - 3);
    dot(ctx, x + 2,     cl.y,     P.cloud,  cl.w - 4, 3);
    dot(ctx, x + 3,     cl.y - 1, P.cloud,  cl.w - 6, 2);
    // 하이라이트
    dot(ctx, x + 2,     cl.y,     P.white,  3, 1);
  }
}

// 4. 원거리 산 (파스텔 민트 실루엣)
const MTN_PROFILE = [0,2,4,6,8,10,12,13,14,14,13,12,10,8,6,4,2,0, 0,1,3,5,7,9,11,12,11,9,7,5,3,1,0, 0,3,6,9,11,12,11,9,6,3,0];
function drawMountains(ctx: CanvasRenderingContext2D, off: number) {
  const pw = MTN_PROFILE.length;
  for (let x = 0; x < CW; x++) {
    const px = ((Math.round(x + off * 0.18)) % pw + pw) % pw;
    const h  = MTN_PROFILE[px];
    const topY = GY - 20 - h;
    dot(ctx, x, topY,      P.mtn1, 1, GY - topY);
    dot(ctx, x, topY,      P.mtn2, 1, 2);
    dot(ctx, x, topY + 2,  P.mtn3, 1, 1);
  }
}

// 5. 중거리 나무 (귀여운 동글 나무)
const TREE_POS = [30, 70, 110, 155, 200, 240];
function drawTrees(ctx: CanvasRenderingContext2D, off: number) {
  for (const tx of TREE_POS) {
    const x = ((tx - Math.round(off * 0.45)) % (CW + 20) + CW + 20) % (CW + 20) - 10;
    const y = GY - 18;
    // 기둥
    dot(ctx, x + 3, y + 10, P.treeT, 3, 8);
    // 잎 (동글동글 3레이어)
    dot(ctx, x + 1, y + 6,  P.tree1, 7, 5);
    dot(ctx, x,     y + 4,  P.tree2, 9, 5);
    dot(ctx, x + 1, y + 2,  P.tree2, 7, 4);
    dot(ctx, x + 2, y,      P.tree3, 5, 3);
    dot(ctx, x + 3, y - 1,  P.tree3, 3, 2);
    // 하이라이트
    dot(ctx, x + 2, y + 1,  P.white, 2, 1);
  }
}

// 6. 농가 (귀여운 픽셀 집)
function drawFarmhouse(ctx: CanvasRenderingContext2D, off: number) {
  const hx = ((180 - Math.round(off * 0.22)) % (CW + 40) + CW + 40) % (CW + 40) - 20;
  const hy = GY - 20;
  // 벽
  dot(ctx, hx,      hy + 6,  P.wall, 18, 14);
  // 지붕
  for (let i = 0; i < 9; i++) {
    dot(ctx, hx + i, hy + 5 - i, P.roof, 18 - i * 2, 1);
  }
  dot(ctx, hx + 8, hy - 4, P.roof, 2, 1);
  // 창문
  dot(ctx, hx + 2,  hy + 8,  P.win,  4, 4);
  dot(ctx, hx + 12, hy + 8,  P.win,  4, 4);
  // 창문 십자
  dot(ctx, hx + 4,  hy + 8,  P.uiBd, 1, 4);
  dot(ctx, hx + 2,  hy + 10, P.uiBd, 4, 1);
  dot(ctx, hx + 14, hy + 8,  P.uiBd, 1, 4);
  dot(ctx, hx + 12, hy + 10, P.uiBd, 4, 1);
  // 문
  dot(ctx, hx + 7,  hy + 11, P.door, 4, 9);
  dot(ctx, hx + 8,  hy + 13, P.white, 1, 1);
  // 굴뚝
  dot(ctx, hx + 13, hy - 2,  P.uiRed, 3, 6);
  dot(ctx, hx + 12, hy - 3,  P.uiRed, 5, 2);
  // 연기 (작은 도트)
  dot(ctx, hx + 14, hy - 5,  P.cloudS, 2, 2);
  dot(ctx, hx + 15, hy - 8,  P.cloudS, 1, 2);
}

// 7. 녹차밭 (계단식 + 귀여운 찻잎 패턴)
function drawTeaField(ctx: CanvasRenderingContext2D, off: number) {
  // 바닥 기본
  dot(ctx, 0, GY, P.path, CW, CH - GY);

  // 길 (파스텔 황토)
  dot(ctx, 0, GY,     P.path,  CW, 5);
  dot(ctx, 0, GY + 1, P.pathD, CW, 1);

  // 길 줄무늬
  const sOff = Math.round(off) % 14;
  for (let x = -sOff; x < CW; x += 14) {
    dot(ctx, x, GY + 2, P.pathL, 7, 1);
  }

  // 녹차밭 배경
  dot(ctx, 0, GY + 5, P.tea1, CW, CH - GY - 5);

  // 차나무 행 (귀여운 동글 패턴)
  const tOff = Math.round(off * 0.85) % 18;
  for (let x = -tOff; x < CW; x += 18) {
    // 차나무 (동글동글)
    dot(ctx, x,     GY + 6,  P.tea2, 7, 3);
    dot(ctx, x + 1, GY + 5,  P.tea3, 5, 2);
    dot(ctx, x + 2, GY + 4,  P.tea4, 3, 2);
    dot(ctx, x + 2, GY + 4,  P.tea5, 1, 1);  // 하이라이트
    // 두 번째 차나무
    dot(ctx, x + 10, GY + 7,  P.tea2, 6, 2);
    dot(ctx, x + 11, GY + 6,  P.tea3, 4, 2);
    dot(ctx, x + 11, GY + 6,  P.tea5, 1, 1);
  }

  // 꽃 (핑크/노랑 교대)
  const fOff = Math.round(off * 0.9) % 22;
  for (let x = -fOff; x < CW; x += 22) {
    // 핑크 꽃
    dot(ctx, x + 4, GY + 3,  P.fl1, 1, 1);
    dot(ctx, x + 3, GY + 4,  P.fl2, 3, 1);
    dot(ctx, x + 4, GY + 5,  P.fl1, 1, 1);
    dot(ctx, x + 4, GY + 4,  P.fl4, 1, 1);  // 꽃 중심
    // 노란 꽃
    dot(ctx, x + 14, GY + 3, P.flY, 1, 1);
    dot(ctx, x + 13, GY + 4, P.flY, 3, 1);
    dot(ctx, x + 14, GY + 5, P.flY, 1, 1);
    dot(ctx, x + 14, GY + 4, P.white, 1, 1);
  }
}

// 8. 나비 (귀여운 픽셀 나비, 날갯짓 애니메이션)
const BUTTERFLIES = [
  { ox: 50,  oy: 28, speed: 0.6,  color: P.bt1, wave: 0.0 },
  { ox: 120, oy: 22, speed: 0.45, color: P.bt2, wave: 1.2 },
  { ox: 190, oy: 32, speed: 0.55, color: P.bt3, wave: 2.4 },
];

function drawButterflies(ctx: CanvasRenderingContext2D, off: number, frame: number) {
  for (const bt of BUTTERFLIES) {
    const x = ((bt.ox - off * bt.speed) % (CW + 20) + CW + 20) % (CW + 20) - 10;
    const y = bt.oy + Math.sin(frame * 0.08 + bt.wave) * 3;
    const wing = Math.floor(frame * 0.18 + bt.wave) % 2; // 날갯짓
    // 날개
    if (wing === 0) {
      dot(ctx, x - 3, y - 1, bt.color, 3, 2);
      dot(ctx, x + 2, y - 1, bt.color, 3, 2);
      dot(ctx, x - 2, y + 1, bt.color, 2, 1);
      dot(ctx, x + 2, y + 1, bt.color, 2, 1);
    } else {
      dot(ctx, x - 2, y,     bt.color, 2, 2);
      dot(ctx, x + 2, y,     bt.color, 2, 2);
    }
    // 몸통
    dot(ctx, x,     y,     P.black, 2, 3);
    // 더듬이
    dot(ctx, x - 1, y - 2, P.black, 1, 1);
    dot(ctx, x + 2, y - 2, P.black, 1, 1);
  }
}

// 9. 장애물 (귀여운 파스텔 덤불)
function drawObstacle(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null) {
  const y = GY - OBH;
  if (img) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, OBW, OBH);
    ctx.restore(); return;
  }
  // 귀여운 동글 덤불 (파스텔 그린)
  dot(ctx, x + 1, y + 4, P.tea1,  9, 7);
  dot(ctx, x,     y + 5, P.tea1,  11, 5);
  dot(ctx, x + 2, y + 2, P.tea2,  7, 5);
  dot(ctx, x + 3, y + 1, P.tea3,  5, 4);
  dot(ctx, x + 4, y,     P.tea4,  3, 3);
  // 하이라이트
  dot(ctx, x + 3, y + 1, P.tea5,  2, 1);
  dot(ctx, x + 5, y + 2, P.tea5,  1, 1);
  // 꽃 장식
  dot(ctx, x + 2, y + 3, P.fl1,   1, 1);
  dot(ctx, x + 7, y + 4, P.flY,   1, 1);
  // 그림자
  dot(ctx, x + 1, GY, P.shadow, 9, 1);
}

// 10. 에너지 겔 (귀여운 별 모양 캡슐)
function drawGel(ctx: CanvasRenderingContext2D, x: number, img: HTMLImageElement | null, frame: number) {
  const bob = Math.round(Math.sin(frame * 0.14) * 1.5);
  const y   = GY - ITH - 4 + bob;
  if (img) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, ITW, ITH);
    ctx.restore(); return;
  }
  // 귀여운 별 캡슐 (파스텔 골드)
  dot(ctx, x + 1, y,     "#ffe066", 7, 1);
  dot(ctx, x,     y + 1, "#ffe066", 9, 7);
  dot(ctx, x + 1, y + 8, "#ffe066", 7, 1);
  // 하이라이트
  dot(ctx, x + 1, y + 1, "#fff9c4", 3, 2);
  // 별 기호
  dot(ctx, x + 3, y + 3, "#f9a825", 1, 1);
  dot(ctx, x + 4, y + 2, "#f9a825", 1, 3);
  dot(ctx, x + 5, y + 3, "#f9a825", 1, 1);
  dot(ctx, x + 3, y + 4, "#f9a825", 3, 1);
  // 반짝임 파티클
  if (Math.floor(frame * 0.2) % 3 === 0) {
    dot(ctx, x - 1, y + 2, "#fffde7", 1, 1);
    dot(ctx, x + 10, y + 5, "#fffde7", 1, 1);
  }
}

// 11. 플레이어 (귀엽고 동글동글한 도트 캐릭터)
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  py: number, img: HTMLImageElement | null,
  frame: number, isStep2: boolean, grounded: boolean
) {
  if (img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const scaleY = grounded ? (1 - Math.abs(Math.sin(frame * 0.25)) * 0.04) : 1;
    const dh = Math.round(PLH * scaleY);
    ctx.drawImage(img, PLX, Math.round(py + PLH - dh), PLW, dh);
    ctx.restore();
    return;
  }

  // 귀여운 동글 캐릭터
  const legF   = Math.floor(frame / 7) % 4;
  const bodyC  = isStep2 ? "#90caf9" : "#f48fb1";  // 파스텔 블루 / 파스텔 핑크
  const skinC  = "#ffcc99";
  const hairC  = isStep2 ? "#5c6bc0" : "#e91e63";
  const shoeC  = isStep2 ? "#5c6bc0" : "#e91e63";

  // 그림자
  if (grounded) {
    dot(ctx, PLX + 1, GY + 1, P.shadow, PLW - 2, 2);
  }
  // 머리 (동글동글)
  dot(ctx, PLX + 3, py,      skinC, 7, 6);
  dot(ctx, PLX + 2, py + 1,  skinC, 9, 4);
  dot(ctx, PLX + 3, py + 5,  skinC, 7, 1);
  // 머리카락
  dot(ctx, PLX + 3, py,      hairC, 7, 2);
  dot(ctx, PLX + 2, py + 1,  hairC, 2, 1);
  dot(ctx, PLX + 9, py + 1,  hairC, 2, 1);
  // 눈 (귀여운 점)
  dot(ctx, PLX + 4, py + 3,  "#333", 2, 2);
  dot(ctx, PLX + 8, py + 3,  "#333", 2, 2);
  // 눈 하이라이트
  dot(ctx, PLX + 4, py + 3,  P.white, 1, 1);
  dot(ctx, PLX + 8, py + 3,  P.white, 1, 1);
  // 볼 (핑크)
  dot(ctx, PLX + 3, py + 4,  "#ffb3c6", 2, 1);
  dot(ctx, PLX + 9, py + 4,  "#ffb3c6", 2, 1);
  // 입 (웃음)
  dot(ctx, PLX + 5, py + 5,  "#e57373", 3, 1);
  dot(ctx, PLX + 4, py + 5,  "#e57373", 1, 1);
  dot(ctx, PLX + 8, py + 5,  "#e57373", 1, 1);
  // 몸통
  dot(ctx, PLX + 3, py + 6,  bodyC, 7, 5);
  dot(ctx, PLX + 2, py + 7,  bodyC, 9, 3);
  // 팔 (달리기 애니메이션)
  const armSwing = legF < 2 ? 1 : -1;
  dot(ctx, PLX + 1, py + 7 + armSwing,  bodyC, 2, 3);
  dot(ctx, PLX + 10, py + 7 - armSwing, bodyC, 2, 3);
  // 다리
  if (grounded) {
    if (legF === 0) {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 3, py + 14, shoeC, 3, 2);
      dot(ctx, PLX + 7, py + 13, shoeC, 4, 2);
    } else if (legF === 1) {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 3);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 3, py + 13, shoeC, 4, 2);
      dot(ctx, PLX + 7, py + 14, shoeC, 3, 2);
    } else if (legF === 2) {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 2);
      dot(ctx, PLX + 3, py + 14, shoeC, 3, 2);
      dot(ctx, PLX + 6, py + 12, shoeC, 4, 2);
    } else {
      dot(ctx, PLX + 3, py + 11, bodyC, 3, 2);
      dot(ctx, PLX + 7, py + 11, bodyC, 3, 4);
      dot(ctx, PLX + 2, py + 12, shoeC, 4, 2);
      dot(ctx, PLX + 7, py + 14, shoeC, 3, 2);
    }
  } else {
    // 점프 자세
    dot(ctx, PLX + 2, py + 11, bodyC, 4, 3);
    dot(ctx, PLX + 7, py + 11, bodyC, 4, 3);
    dot(ctx, PLX + 1, py + 13, shoeC, 4, 2);
    dot(ctx, PLX + 8, py + 13, shoeC, 4, 2);
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function formatDist(n: number): string {
  return (n / 1000).toFixed(3) + " km";
}
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function isColliding(px: number, py: number, pw: number, ph: number, sx: number, sy: number, sw: number, sh: number, margin = 2): boolean {
  return px + margin < sx + sw - margin && px + pw - margin > sx + margin && py + margin < sy + sh - margin && py + ph - margin > sy + margin;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function Stage11DinoRunGame({ stage, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  const statusRef     = useRef<GameStatus>("idle");
  const stepRef       = useRef<1 | 2>(1);
  const scoreRef      = useRef(0);
  const livesRef      = useRef(MAX_LIVES);
  const invincibleRef = useRef(false);
  const invTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef      = useRef(0);
  const spritesRef    = useRef<Sprite[]>([]);
  const spriteIdRef   = useRef(0);
  const groundOffRef  = useRef(0);
  const hillOffRef    = useRef(0);
  const particlesRef  = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);

  const playerYRef  = useRef(GY - PLH);
  const playerVYRef = useRef(0);
  const groundedRef = useRef(true);

  const imgsRef    = useRef<Record<string, HTMLImageElement | null>>({});
  const effectsRef = useRef<FloatEffect[]>([]);
  const effectIdRef = useRef(0);

  const [status,  setStatus]  = useState<GameStatus>("idle");
  const [step,    setStep]    = useState<1 | 2>(1);
  const [score,   setScore]   = useState(0);
  const [lives,   setLives]   = useState(MAX_LIVES);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    [IMG_YEONGSEO, IMG_JINSEONG, IMG_OBSTACLE, IMG_GEL].forEach(async (src) => {
      imgsRef.current[src] = await loadImg(src);
    });
  }, []);

  const jump = useCallback(() => {
    if (!groundedRef.current || statusRef.current !== "playing") return;
    playerVYRef.current = JUMP_VY;
    groundedRef.current = false;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  const triggerInvincible = useCallback(() => {
    invincibleRef.current = true;
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
    invTimerRef.current = setTimeout(() => { invincibleRef.current = false; }, INVINCIBLE_MS);
  }, []);

  // 찻잎 파티클 생성
  const spawnLeaves = useCallback((x: number, y: number) => {
    const colors = [P.tea3, P.tea4, P.tea5, P.fl1, P.flY];
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x, y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -1.5 - Math.random() * 2,
        life: 30 + Math.floor(Math.random() * 20),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1 + Math.floor(Math.random() * 2),
      });
    }
  }, []);

  // ── 게임 루프 ──
  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const cfg    = STEP_CONFIG[stepRef.current];
    const target = stepRef.current === 1 ? STEP1_TARGET : STEP2_TARGET;
    frameRef.current++;
    const fc = frameRef.current;

    // 점수
    scoreRef.current = Math.min(scoreRef.current + cfg.scorePerFrame, target);
    if (scoreRef.current >= target) {
      statusRef.current = stepRef.current === 1 ? "step_clear" : "cleared";
      setScore(target); setStatus(statusRef.current);
      cancelAnimationFrame(rafRef.current); return;
    }

    // 물리
    if (!groundedRef.current) {
      playerVYRef.current = Math.min(playerVYRef.current + GRAVITY, MAX_FALL);
      playerYRef.current += playerVYRef.current;
      if (playerYRef.current >= GY - PLH) {
        playerYRef.current = GY - PLH;
        playerVYRef.current = 0;
        groundedRef.current = true;
      }
    }

    // 스크롤
    groundOffRef.current += cfg.scrollSpeed;
    hillOffRef.current   += cfg.scrollSpeed;

    // 스프라이트
    spritesRef.current = spritesRef.current
      .map((s) => ({ ...s, x: s.x - cfg.scrollSpeed }))
      .filter((s) => s.x > -OBW - 4);
    if (fc % cfg.spawnInterval === 0) {
      spritesRef.current.push({
        id: spriteIdRef.current++,
        x: CW + 4,
        type: Math.random() < cfg.itemChance ? "item" : "obstacle",
      });
    }

    // 충돌
    const py = playerYRef.current;
    for (let i = spritesRef.current.length - 1; i >= 0; i--) {
      const s = spritesRef.current[i];
      if (s.x > CW) continue;
      if (s.type === "obstacle") {
        const oy = GY - OBH;
        if (!invincibleRef.current && isColliding(PLX, py, PLW, PLH, s.x, oy, OBW, OBH)) {
          livesRef.current--;
          setLives(livesRef.current);
          spritesRef.current.splice(i, 1);
          triggerInvincible();
          spawnLeaves(s.x + OBW / 2, oy);
          if (livesRef.current <= 0) {
            statusRef.current = "gameover"; setStatus("gameover");
            cancelAnimationFrame(rafRef.current); return;
          }
        }
      } else {
        const iy = GY - ITH - 4;
        if (isColliding(PLX, py, PLW, PLH, s.x, iy, ITW, ITH, 1)) {
          scoreRef.current = Math.min(scoreRef.current + GEL_BONUS, target);
          spritesRef.current.splice(i, 1);
          effectsRef.current.push({ id: effectIdRef.current++, text: "+0.5km ★", x: PLX + PLW / 2, y: py - 2, life: 45 });
          spawnLeaves(s.x + ITW / 2, iy);
        }
      }
    }

    // 파티클
    particlesRef.current = particlesRef.current
      .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, life: p.life - 1 }))
      .filter((p) => p.life > 0);

    // 이펙트
    effectsRef.current = effectsRef.current
      .map((e) => ({ ...e, y: e.y - 0.28, life: e.life - 1 }))
      .filter((e) => e.life > 0);

    // ── 렌더링 ──────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, CW, CH);

    // 배경 레이어 순서
    drawSky(ctx);
    drawRainbow(ctx, stepRef.current === 1 ? 1 : 0.3);
    drawClouds(ctx, fc);
    drawMountains(ctx, hillOffRef.current);
    drawTrees(ctx, hillOffRef.current);
    drawFarmhouse(ctx, hillOffRef.current);
    drawTeaField(ctx, groundOffRef.current);
    drawButterflies(ctx, hillOffRef.current, fc);

    // 스프라이트
    for (const s of spritesRef.current) {
      if (s.type === "obstacle") drawObstacle(ctx, Math.round(s.x), imgsRef.current[IMG_OBSTACLE]);
      else drawGel(ctx, Math.round(s.x), imgsRef.current[IMG_GEL], fc);
    }

    // 파티클
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life / 50;
      dot(ctx, Math.round(p.x), Math.round(p.y), p.color, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // 플레이어
    const blinkOn = invincibleRef.current && Math.floor(fc / 4) % 2 === 0;
    if (!blinkOn) {
      const pImg = imgsRef.current[stepRef.current === 1 ? IMG_YEONGSEO : IMG_JINSEONG];
      drawPlayer(ctx, Math.round(playerYRef.current), pImg, fc, stepRef.current === 2, groundedRef.current);
    }

    // 이펙트 텍스트
    for (const ef of effectsRef.current) {
      ctx.globalAlpha = ef.life / 45;
      pixelText(ctx, ef.text, Math.round(ef.x), Math.round(ef.y), P.uiGold, 4, "center");
    }
    ctx.globalAlpha = 1;

    if (fc % 10 === 0) setScore(scoreRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [triggerInvincible, spawnLeaves]);

  const startGame = useCallback((targetStep: 1 | 2) => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
    stepRef.current = targetStep; statusRef.current = "playing";
    scoreRef.current = 0; livesRef.current = MAX_LIVES;
    invincibleRef.current = false; frameRef.current = 0;
    spritesRef.current = []; groundOffRef.current = 0; hillOffRef.current = 0;
    playerYRef.current = GY - PLH; playerVYRef.current = 0; groundedRef.current = true;
    effectsRef.current = []; particlesRef.current = [];
    setStep(targetStep); setStatus("playing"); setScore(0); setLives(MAX_LIVES);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleStep2Start = useCallback(() => startGame(2), [startGame]);
  const handleRetry      = useCallback(() => startGame(stepRef.current), [startGame]);
  const handleFinalClear = useCallback(() => onComplete(), [onComplete]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (invTimerRef.current) clearTimeout(invTimerRef.current);
  }, []);

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  const isPlaying = ["playing","gameover","step_clear","cleared"].includes(status);
  const target    = step === 1 ? STEP1_TARGET : STEP2_TARGET;
  const pct       = Math.min(100, Math.round((score / target) * 100));

  const pxFont: React.CSSProperties = {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
  };

  // 파스텔 팝업 공통 스타일
  const popupBase: React.CSSProperties = {
    background: "linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%)",
    borderRadius: 0,
    padding: "18px 22px",
    textAlign: "center",
    animation: "s11-popup 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards",
    maxWidth: 260,
    ...pxFont,
  };

  return (
    <GameLayout
      stage={stage}
      score={score}
      maxScore={target}
      hintText="스페이스바·클릭·터치로 점프! 장애물 피하고 에너지 겔 먹기 🍵"
      showProgress={false}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes s11-popup {
          0%   { transform: scale(0.6) translateY(6px); opacity: 0; }
          65%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes s11-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes s11-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-3px); }
        }
        @keyframes s11-sparkle {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.5; transform:scale(1.4); }
        }
        .s11-canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
        .s11-btn {
          cursor: pointer;
          transition: transform 0.06s, box-shadow 0.06s;
        }
        .s11-btn:active {
          transform: translate(2px,2px) !important;
          box-shadow: none !important;
        }
        .s11-hud-heart { animation: s11-float 1.2s ease-in-out infinite; }
      `}</style>

      <div className="flex-1 flex flex-col items-center px-3 py-2 gap-3">

        {/* ── 시작 화면 ── */}
        {!started && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div
              style={{
                background: "linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 50%, #f3e5f5 100%)",
                padding: "22px 20px",
                maxWidth: 320,
                width: "100%",
                boxShadow: "4px 4px 0 #a5d6a7, 8px 8px 0 #c8e6c9",
                ...pxFont,
              }}
            >
              {/* 타이틀 */}
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: "0.52rem", color: P.uiPink, marginBottom: 4, letterSpacing: "0.04em" }}>
                  ✿ STAGE 11 ✿
                </div>
                <div style={{ fontSize: "0.68rem", color: P.uiTxt, lineHeight: 1.9 }}>
                  보성 녹차마라톤
                </div>
                <div style={{ fontSize: "0.44rem", color: P.tea2, marginTop: 2 }}>
                  🍵 BOSEONG GREEN TEA MARATHON 🍵
                </div>
              </div>

              {/* 구분선 (파스텔 도트) */}
              <div style={{ display: "flex", gap: 3, justifyContent: "center", marginBottom: 12 }}>
                {["#f48fb1","#ffe066","#a5d6a7","#90caf9","#ce93d8"].map((c,i) => (
                  <div key={i} style={{ width: 5, height: 5, background: c, borderRadius: 1 }} />
                ))}
              </div>

              {/* 거리 카드 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                {[
                  { icon: "♀", name: "영서", dist: "10.000 km", bg: "#fce4ec", bd: P.uiPink, tc: P.uiPink },
                  { icon: "♂", name: "진성", dist: "42.195 km", bg: "#e3f2fd", bd: P.uiBlue, tc: P.uiBlue },
                ].map((p) => (
                  <div key={p.name} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: p.bg, padding: "5px 10px",
                    boxShadow: `2px 2px 0 ${p.bd}44`,
                  }}>
                    <span style={{ fontSize: "0.65rem", color: p.tc }}>{p.icon}</span>
                    <span style={{ fontSize: "0.50rem", color: "#555", flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: "0.52rem", color: p.tc, fontWeight: "bold" }}>{p.dist}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "5px 10px", background: "#fffde7",
                  boxShadow: `2px 2px 0 ${P.uiGold}66`,
                }}>
                  <span style={{ fontSize: "0.50rem", color: P.uiGold }}>★ TOTAL</span>
                  <span style={{ fontSize: "0.52rem", color: P.uiGold, fontWeight: "bold" }}>52.195 km</span>
                </div>
              </div>

              {/* 조작 안내 */}
              <div style={{ fontSize: "0.42rem", color: "#888", lineHeight: 2.2, textAlign: "center", marginBottom: 16 }}>
                [SPACE] / CLICK / TOUCH → JUMP<br />
                🌿 AVOID BUSHES &nbsp;·&nbsp; ⭐ COLLECT GEL
              </div>

              {/* 시작 버튼 */}
              <button
                className="s11-btn"
                onClick={() => { setStarted(true); startGame(1); }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #a5d6a7, #66bb6a)",
                  color: "#1b5e20",
                  border: "none",
                  padding: "11px 0",
                  fontSize: "0.60rem",
                  boxShadow: `3px 3px 0 #2e7d32`,
                  letterSpacing: "0.04em",
                  ...pxFont,
                }}
              >
                ▶ START GAME
              </button>
            </div>
          </div>
        )}

        {/* ── 게임 플레이 영역 ── */}
        {started && isPlaying && (
          <div className="flex flex-col items-center gap-2 w-full">

            {/* HUD */}
            <div
              style={{
                width: "100%", maxWidth: CW * PX,
                background: "linear-gradient(135deg, #f1f8e9, #e8f5e9)",
                padding: "6px 10px",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "3px 3px 0 #a5d6a7",
                ...pxFont,
              }}
            >
              {/* 스텝 배지 */}
              <div style={{
                fontSize: "0.40rem",
                color: step === 1 ? P.uiPink : P.uiBlue,
                background: step === 1 ? "#fce4ec" : "#e3f2fd",
                padding: "3px 7px",
                boxShadow: `1px 1px 0 ${step === 1 ? P.uiPink : P.uiBlue}88`,
                flexShrink: 0,
              }}>
                {step === 1 ? "P1 영서♀" : "P2 진성♂"}
              </div>

              {/* 거리 */}
              <div style={{ fontSize: "0.46rem", color: P.uiTxt, flexShrink: 0 }}>
                {formatDist(score)}
              </div>

              {/* 프로그레스 바 (파스텔 도트 패턴) */}
              <div style={{
                flex: 1, height: 7,
                background: "#e8f5e9",
                boxShadow: "inset 1px 1px 0 #c8e6c9",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: step === 1
                    ? "repeating-linear-gradient(90deg,#a5d6a7 0 3px,#66bb6a 3px 6px)"
                    : "repeating-linear-gradient(90deg,#90caf9 0 3px,#42a5f5 3px 6px)",
                  transition: "width 200ms steps(16)",
                }} />
                {/* 진행 퍼센트 */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.34rem", color: "#2e7d32",
                }}>
                  {pct}%
                </div>
              </div>

              {/* 목숨 하트 */}
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span
                    key={i}
                    className={i < lives ? "s11-hud-heart" : ""}
                    style={{
                      fontSize: "0.85rem",
                      opacity: i < lives ? 1 : 0.2,
                      filter: i < lives ? "none" : "grayscale(1)",
                      animationDelay: `${i * 0.2}s`,
                      display: "inline-block",
                    }}
                  >
                    {i < lives ? "♥" : "♡"}
                  </span>
                ))}
              </div>
            </div>

            {/* 캔버스 */}
            <div
              style={{
                position: "relative", width: "100%", maxWidth: CW * PX,
                cursor: "pointer", touchAction: "none",
                boxShadow: "4px 4px 0 #a5d6a7, 8px 8px 0 #c8e6c9",
              }}
              onClick={() => jump()}
              onTouchStart={(e) => { e.preventDefault(); jump(); }}
            >
              <canvas
                ref={canvasRef}
                width={CW} height={CH}
                className="s11-canvas"
                style={{ display: "block", width: "100%", height: "auto" }}
              />

              {/* Step 1 클리어 */}
              {status === "step_clear" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,250,240,0.82)" }}>
                  <div style={{ ...popupBase, boxShadow: "4px 4px 0 #a5d6a7" }}>
                    <div style={{ fontSize: "0.55rem", color: P.uiPink, marginBottom: 8, animation: "s11-sparkle 1s infinite" }}>
                      ✿ STEP 1 CLEAR ✿
                    </div>
                    <div style={{ fontSize: "0.44rem", color: P.uiTxt, lineHeight: 2.2, marginBottom: 14 }}>
                      영서 10km 완주!<br />
                      <span style={{ color: P.uiPink }}>진성이에게 바통 터치~</span><br />
                      <span style={{ fontSize: "0.38rem", color: "#888" }}>🏃‍♀️💨🏃</span>
                    </div>
                    <button
                      className="s11-btn"
                      onClick={(e) => { e.stopPropagation(); handleStep2Start(); }}
                      style={{
                        background: "linear-gradient(135deg,#f48fb1,#f06292)",
                        color: P.white, border: "none", padding: "9px 16px",
                        fontSize: "0.44rem", boxShadow: "2px 2px 0 #c2185b",
                        width: "100%", ...pxFont,
                      }}
                    >
                      ▶ 진성이 달리기 시작!
                    </button>
                  </div>
                </div>
              )}

              {/* 게임 오버 */}
              {status === "gameover" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,250,240,0.82)" }}>
                  <div style={{ ...popupBase, boxShadow: "4px 4px 0 #ef9a9a" }}>
                    <div style={{ fontSize: "0.55rem", color: P.uiRed, marginBottom: 8, animation: "s11-blink 0.9s infinite" }}>
                      GAME OVER
                    </div>
                    <div style={{ fontSize: "0.42rem", color: P.uiTxt, lineHeight: 2.2, marginBottom: 14 }}>
                      {step === 1 ? "영서" : "진성이"}가<br />
                      <span style={{ color: P.uiGold }}>{formatDist(score)}</span> 달렸어요<br />
                      <span style={{ fontSize: "0.38rem", color: "#888" }}>다시 도전해봐요! 🌿</span>
                    </div>
                    <button
                      className="s11-btn"
                      onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                      style={{
                        background: "linear-gradient(135deg,#ef9a9a,#ef5350)",
                        color: P.white, border: "none", padding: "9px 16px",
                        fontSize: "0.44rem", boxShadow: "2px 2px 0 #b71c1c",
                        width: "100%", ...pxFont,
                      }}
                    >
                      ▶ RETRY
                    </button>
                  </div>
                </div>
              )}

              {/* 최종 클리어 */}
              {status === "cleared" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,250,240,0.82)" }}>
                  <div style={{ ...popupBase, boxShadow: "4px 4px 0 #ffe066, 8px 8px 0 #f9a825" }}>
                    <div style={{ fontSize: "0.52rem", color: P.uiGold, marginBottom: 6, animation: "s11-sparkle 0.8s infinite" }}>
                      ★ MARATHON CLEAR ★
                    </div>
                    <div style={{ height: 2, background: "repeating-linear-gradient(90deg,#f48fb1 0 4px,#ffe066 4px 8px,#a5d6a7 8px 12px,#90caf9 12px 16px)", marginBottom: 10 }} />
                    <div style={{ fontSize: "0.44rem", color: P.uiTxt, lineHeight: 2.4, marginBottom: 16 }}>
                      52.195km 완주 성공!<br />
                      <span style={{ color: P.uiPink }}>우리의 첫 마라톤 클리어</span><br />
                      <span style={{ fontSize: "0.40rem", color: P.uiGold }}>🥇 CONGRATULATIONS 🥇</span>
                    </div>
                    <button
                      className="s11-btn"
                      onClick={(e) => { e.stopPropagation(); handleFinalClear(); }}
                      style={{
                        background: "linear-gradient(135deg,#ffe066,#f9a825)",
                        color: "#4e342e", border: "none", padding: "11px 20px",
                        fontSize: "0.50rem", boxShadow: "3px 3px 0 #e65100",
                        width: "100%", ...pxFont, letterSpacing: "0.04em",
                      }}
                    >
                      ▶ NEXT STAGE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 안내 */}
            {status === "playing" && (
              <div style={{ ...pxFont, fontSize: "0.36rem", color: P.tea2, textAlign: "center", opacity: 0.85 }}>
                [SPACE] / CLICK / TOUCH → JUMP &nbsp;·&nbsp; 🌿 avoid &nbsp;·&nbsp; ⭐ collect
              </div>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
