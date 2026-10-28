import type { BrandKit, KitPalette } from "../types/studio";

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Color de texto legible sobre `bg`, elegido SOLO entre la paleta del kit (guardrail). */
export function readableOn(bg: string, p: KitPalette): string {
  return contrast(bg, p.background) >= contrast(bg, p.primary) ? p.background : p.primary;
}

export interface PairCheck {
  label: string;
  ratio: number;
  ok: boolean;
}
/** Pares de color que realmente usan las plantillas. */
export function auditKit(kit: BrandKit): PairCheck[] {
  const p = kit.palette;
  const pairs: [string, string, string][] = [
    ["Tinta sobre fondo", p.primary, p.background],
    ["Tinta sobre superficie", p.primary, p.surface],
    ["Acento sobre fondo", p.accent, p.background],
    ["Acento sobre superficie", p.accent, p.surface],
    ["Texto sobre acento", readableOn(p.accent, p), p.accent],
    ["Texto sobre tinta", readableOn(p.primary, p), p.primary],
  ];
  return pairs.map(([label, fg, bg]) => {
    const ratio = contrast(fg, bg);
    return { label, ratio, ok: ratio >= 4.5 };
  });
}
