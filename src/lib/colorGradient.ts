// 팀 배지 색상 하나로부터 결과 카드 헤더의 3-스톱 방사형 그라디언트를 만든다.
// 승요 판독기.dc.html의 삼성 예시(배지 #002D72 → 헤더 스톱 #2C6FDE/#1657C4/#0D3E8F)를 HSL로
// 역산해보면 세 스톱 모두 배지색과 색상(H)은 같고, 채도를 살짝 낮추고 명도를 크게 올린 값이다.
// 이 관계를 일반화해 10개 팀 전체에 동일한 규칙으로 적용한다.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return [0, 0, l * 100];

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
  else h = 60 * ((rn - gn) / delta + 4);
  if (h < 0) h += 360;

  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 카드 헤더용 3-스톱 그라디언트 색상 [상단(밝음), 중단, 하단] */
export function deriveHeaderGradient(baseHex: string): [string, string, string] {
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  const stop1 = hslToHex(h, clamp(s - 20, 45, 100), clamp(l + 30, 0, 62));
  const stop2 = hslToHex(h, clamp(s - 17, 45, 100), clamp(l + 20, 0, 55));
  const stop3 = hslToHex(h, clamp(s - 15, 45, 100), clamp(l + 9, 0, 46));

  return [stop1, stop2, stop3];
}
