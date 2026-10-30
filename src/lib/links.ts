import type { ClinicalDNA, Post } from "../types/studio";

/** Dominio de la agenda donde viven las páginas de reserva (hoy Connectv5). */
export const DEFAULT_BOOKING_BASE = "https://connectv5.vercel.app";

export const slugify = (name: string): string =>
  name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/^ps\.?\s+/i, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40) || "mi-consulta";

export const slugOf = (dna: ClinicalDNA): string => dna.slug?.trim() || slugify(dna.name);

/** Link a la página de reservas con el origen de la pieza, para medir cuántas reservas trae cada publicación. */
export function trackedLink(dna: ClinicalDNA, post: Post): string {
  const base = (dna.bookingBase?.trim() || DEFAULT_BOOKING_BASE).replace(/\/+$/, "");
  const q = new URLSearchParams({ src: `ig-${post.id.slice(-8)}`, utm_source: "instagram", utm_medium: "social", utm_campaign: post.format });
  return `${base}/p/${slugOf(dna)}?${q.toString()}`;
}

/** Agrega el link a la descripción si todavía no está. */
export function withLink(caption: string, link: string): string {
  if (caption.includes(link)) return caption;
  return `${caption.trimEnd()}${caption.trim() ? "\n\n" : ""}Agenda tu hora aquí: ${link}`;
}
