import type { Post, PostStatus } from "../types/studio";
import type { EthicsReport } from "./ethics";
import { hasBlocking } from "./ethics";

export interface Gate {
  ok: boolean;
  reason?: string;
}

export const STATUS_LABEL: Record<PostStatus, string> = {
  borrador: "Borrador",
  aprobado: "Aprobado por el psicólogo",
  programado: "Programado",
  publicado: "Publicado",
};

/**
 * Reglas del flujo: borrador → aprobado → programado → publicado.
 * Nada pasa de borrador sin revisión ética limpia ni sin aprobación explícita del psicólogo.
 */
export function canMove(post: Post, to: PostStatus, report: EthicsReport): Gate {
  if (to === "borrador") return { ok: true };
  if (hasBlocking(report)) return { ok: false, reason: "Hay un problema ético por corregir (pestaña Ética)." };
  if (to === "aprobado") return { ok: true };
  if (!post.approvedAt) return { ok: false, reason: "Primero debe aprobarla el psicólogo." };
  if (to === "programado" && !post.scheduledAt) return { ok: false, reason: "Elige una fecha para programarla." };
  return { ok: true };
}

/** Si el contenido cambia después de aprobar, la aprobación deja de valer. */
export function invalidateApproval(post: Post): Post {
  if (!post.approvedAt || post.status === "publicado") return post;
  return { ...post, status: "borrador", approvedAt: undefined };
}

/** Aplica el cambio de estado respetando las reglas; si no se puede, devuelve la pieza intacta. */
export function moveTo(post: Post, to: PostStatus, report: EthicsReport, now = new Date().toISOString()): { post: Post; gate: Gate } {
  const gate = canMove(post, to, report);
  if (!gate.ok) return { post, gate };
  if (to === "borrador") return { post: { ...post, status: to, approvedAt: undefined }, gate };
  if (to === "aprobado") return { post: { ...post, status: to, approvedAt: now }, gate };
  return { post: { ...post, status: to }, gate };
}
