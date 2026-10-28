export type PaletteKey = "background" | "surface" | "primary" | "accent";
export type KitId = "calido-cercano" | "minimal-clinico" | "mente-tierra" | "editorial-profundo";
export type FontRole = "heading" | "body";

export interface KitPalette {
  background: string;
  surface: string;
  primary: string;
  accent: string;
}

export interface BrandKit {
  kit_id: KitId;
  name: string;
  archetype: string;
  description: string;
  palette: KitPalette;
  /** Pares tipográficos curados (nombre de familia, cargada con @fontsource). */
  fonts: Record<FontRole, string>;
  voice_prompt: string;
  recommended_for: Approach[];
}

export type Approach = "TCC" | "Humanista" | "Sistémico" | "Psicoanálisis" | "Somático / Mindfulness" | "Integrativo";
export type TherapeuticTone = "calido" | "estructurado" | "reflexivo";

export interface ClinicalDNA {
  name: string;
  website?: string;
  handle: string;
  title: string;
  approach: Approach;
  target_population: string;
  recurring_concern: string;
  tone: TherapeuticTone;
}

export type FormatId =
  | "mito-realidad" | "carrusel-psicoeducativo" | "frase-validacion" | "disponibilidad" | "guion-reel"
  | "sabias-que" | "checklist" | "afirmacion" | "cifra" | "antes-despues" | "faq" | "sobre-mi" | "evento";
/** Diseño genérico de las láminas de una sola pieza (los 5 formatos originales tienen plantilla propia). */
export type Layout = "quote" | "stat" | "text" | "list" | "faq" | "pair";
export type Pillar = "psicoeducacion" | "desmitificacion" | "sintomas";
export type PostStatus = "borrador" | "programado" | "publicado";
export type RatioId = "story" | "feed-square" | "feed-portrait";
/** Categoría usada por el Harmonizer para alternar el ritmo del feed. */
export type FeedCategory = "educativo" | "emocional" | "conversion" | "video";

export interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  max: number;
  multiline?: boolean;
}

export type Fields = Record<string, string>;

export interface FormatDef {
  id: FormatId;
  title: string;
  description: string;
  category: FeedCategory;
  fields: FieldDef[];
  slides: number;
  /** Banco local de variantes (se usa si no hay IA disponible). `{motivo}` se reemplaza con el ClinicalDNA. */
  variants: Fields[];
  layout?: Layout;
  ratio?: RatioId;
  /** Campo que se muestra como etiqueta destacada (layout "text") y campo que se muestra como botón. */
  chip?: string;
  cta?: string;
  /** Campo que recibe el tema del plan semanal (valor ya formateado). */
  topicKey?: string;
  /** Qué cuidar al usar este formato; se muestra en el panel de contenido. */
  caution?: string;
  /** Contenido inicial a partir de un tema; sin esto se usa el banco de variantes. */
  fromTopic?: (topic: string, dna: ClinicalDNA) => Fields;
}

interface LayerBase {
  id: string;
  /** Centro de la capa en el espacio de diseño (px del lienzo exportado). */
  x: number;
  y: number;
}
export type TextSize = "S" | "M" | "L";
export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  font: FontRole;
  color: PaletteKey;
  size: TextSize;
}
export type StickerKind = "agenda" | "cupos" | "monograma";
export interface StickerLayer extends LayerBase {
  type: "sticker";
  kind: StickerKind;
  label: string;
}
export interface ImageLayer extends LayerBase {
  type: "image";
  src: string;
  width: number;
}
export type Layer = TextLayer | StickerLayer | ImageLayer;

export interface Stroke {
  id: string;
  color: PaletteKey;
  width: number;
  points: [number, number][];
}

export interface SlideExtras {
  layers: Layer[];
  strokes: Stroke[];
}

export interface Post {
  id: string;
  format: FormatId;
  ratio: RatioId;
  kit_id: KitId;
  fields: Fields;
  extras: SlideExtras[];
  /** Descripción de Instagram (se revisa con las mismas reglas éticas). */
  caption?: string;
  topic?: string;
  pillar?: Pillar;
  /** Id de la idea del plan semanal de la que nació. */
  planId?: string;
  status?: PostStatus;
  /** YYYY-MM-DD */
  scheduledAt?: string;
}

export interface Dimensions {
  w: number;
  h: number;
}
