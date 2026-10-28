import type { CSSProperties } from "react";
import type { BrandKit, PaletteKey } from "../../types/studio";

export function kitVars(kit: BrandKit): CSSProperties {
  const p = kit.palette;
  return {
    "--kit-background": p.background,
    "--kit-surface": p.surface,
    "--kit-primary": p.primary,
    "--kit-accent": p.accent,
    "--kit-font-heading": `"${kit.fonts.heading}", Georgia, serif`,
    "--kit-font-body": `"${kit.fonts.body}", system-ui, sans-serif`,
  } as CSSProperties;
}

export const paletteVar = (k: PaletteKey): string => `var(--kit-${k})`;
export const PALETTE_KEYS: PaletteKey[] = ["background", "surface", "primary", "accent"];
export const PALETTE_LABEL: Record<PaletteKey, string> = { background: "Fondo", surface: "Superficie", primary: "Tinta", accent: "Acento" };

export const initials = (name: string): string =>
  name
    .replace(/^(ps\.?|psic[oó]log[oa])\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "P";
