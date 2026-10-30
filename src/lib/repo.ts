import type { ClinicalDNA, KitId, Post } from "../types/studio";

/** Todo lo que el módulo guarda. Es el contrato con la base de datos al unirse a Connectv5. */
export interface StudioState {
  dna: ClinicalDNA;
  kit_id: KitId;
  posts: Post[];
  activeId: string;
  slide: number;
  /** Semana del plan (cambia las ideas al pedir «otra semana»). */
  planRound: number;
}

/**
 * Persistencia del módulo. Hoy: localStorage del navegador (demo).
 * Al unificar con Connectv5 se reemplaza por un adaptador de Supabase que lee/escribe
 * `studio_profiles`, `studio_posts` y `studio_post_events` (ver supabase/migrations/0001_contenido_studio.sql
 * y docs/PORTAR_A_CONNECTV5.md). El resto de la app no cambia.
 */
export interface StudioRepo {
  load(): StudioState | null;
  save(state: StudioState): void;
}

const KEY = "connect-studio-final-v1";
/** Clave del prototipo anterior: si existe, se hereda para no perder lo que ya estaba guardado. */
const LEGACY_KEY = "connect-studio-v1";

export const localRepo: StudioRepo = {
  load() {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
      return raw ? (JSON.parse(raw) as StudioState) : null;
    } catch {
      return null; // almacenamiento no disponible o JSON corrupto: se parte desde la demo
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* cuota llena (p. ej. fotos grandes): se sigue en memoria */
    }
  },
};
