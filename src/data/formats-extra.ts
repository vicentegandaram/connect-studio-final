import type { ClinicalDNA, Fields, FormatDef } from "../types/studio";

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** Quita el prefijo «Mito:» y la puntuación final de un tema del plan. */
export const cleanTopic = (t: string): string => t.replace(/^mito:\s*/i, "").replace(/[.?!]+$/, "").trim();
const sig = (d: ClinicalDNA): string => d.name;

/** Formatos traídos de Spotli Connect, adaptados a los guardrails de Studio (sin testimonios ni promociones). */
export const EXTRA_FORMATS: FormatDef[] = [
  {
    id: "sabias-que", title: "¿Sabías que…?", description: "Un dato que educa, con una línea de contexto.", category: "educativo", slides: 1, layout: "text", topicKey: "dato",
    fields: [{ key: "dato", label: "Dato", max: 130, multiline: true }, { key: "detalle", label: "Detalle", max: 200, multiline: true }],
    variants: [
      { dato: "Sentir ansiedad antes de un cambio es más común de lo que parece.", detalle: "Entender lo que pasa es el primer paso para acompañarte con más amabilidad." },
      { dato: "Dormir mal puede ser una señal de que llevas mucho en la cabeza.", detalle: "Si se repite seguido, conversarlo con un profesional puede ayudar." },
    ],
    fromTopic: (t) => ({ dato: `${cap(cleanTopic(t))} es más común de lo que parece.`, detalle: "Entender lo que pasa es el primer paso para acompañarte con más amabilidad." }),
  },
  {
    id: "checklist", title: "Checklist", description: "Pasos claros y guardables en una sola lámina.", category: "educativo", slides: 1, layout: "list", topicKey: "titulo",
    fields: [{ key: "titulo", label: "Título", max: 90, multiline: true }, { key: "i1", label: "Punto 1", max: 70 }, { key: "i2", label: "Punto 2", max: 70 }, { key: "i3", label: "Punto 3", max: 70 }, { key: "i4", label: "Punto 4", max: 70 }],
    variants: [
      { titulo: "4 pausas rápidas cuando todo se acumula", i1: "Respira lento: inhala 4, exhala 6", i2: "Nombra 3 cosas que ves a tu alrededor", i3: "Suelta los hombros y la mandíbula", i4: "Pide apoyo si lo sientes muy intenso" },
      { titulo: "Antes de dormir con la mente a mil", i1: "Baja las pantallas 30 minutos antes", i2: "Anota lo pendiente para mañana", i3: "Haz tres exhalaciones largas", i4: "Si se repite seguido, consúltalo" },
    ],
    fromTopic: (t) => ({ titulo: cap(cleanTopic(t)), i1: "Respira lento: inhala 4, exhala 6", i2: "Nombra 3 cosas que ves a tu alrededor", i3: "Suelta los hombros y la mandíbula", i4: "Pide apoyo si lo sientes muy intenso" }),
  },
  {
    id: "afirmacion", title: "Afirmación", description: "Un mensaje breve y amable para guardar.", category: "emocional", slides: 1, layout: "quote", ratio: "feed-square",
    fields: [{ key: "frase", label: "Afirmación", max: 120, multiline: true }, { key: "firma", label: "Firma (opcional)", max: 40 }],
    variants: [
      { frase: "Hoy puedo ir a mi ritmo y seguir mereciendo cuidado.", firma: "" },
      { frase: "No tengo que tenerlo todo resuelto para empezar a sentirme mejor.", firma: "" },
    ],
    fromTopic: (_t, d) => ({ frase: "Hoy puedo ir a mi ritmo y seguir mereciendo cuidado.", firma: sig(d) }),
  },
  {
    id: "cifra", title: "Cifra que convence", description: "Un dato clave en grande (duración, modalidad, horario).", category: "conversion", slides: 1, layout: "stat",
    fields: [{ key: "cifra", label: "Cifra", max: 14 }, { key: "etiqueta", label: "Etiqueta", max: 30 }, { key: "detalle", label: "Detalle", max: 150, multiline: true }],
    variants: [
      { cifra: "50 min", etiqueta: "Por sesión", detalle: "Un espacio protegido, a tu ritmo, online o presencial." },
      { cifra: "1 a 1", etiqueta: "Modalidad online", detalle: "Sesiones individuales por videollamada. Agenda desde el link de mi bio." },
    ],
  },
  {
    id: "antes-despues", title: "Antes y después de una idea", description: "Cambia una creencia por otra (no muestra personas ni resultados).", category: "educativo", slides: 1, layout: "pair",
    caution: "Úsalo para pensamientos o hábitos en general, nunca para mostrar cambios de pacientes.",
    fields: [{ key: "antes", label: "Antes", max: 110, multiline: true }, { key: "despues", label: "Después", max: 110, multiline: true }],
    variants: [
      { antes: "«Tengo que poder con todo solo/a.»", despues: "«Pedir apoyo también es cuidarme.»" },
      { antes: "«Si me siento mal, es que algo hice mal.»", despues: "«Sentir malestar a veces es una señal que puedo escuchar.»" },
    ],
  },
  {
    id: "faq", title: "Preguntas frecuentes", description: "Dos dudas comunes sobre la primera sesión.", category: "conversion", slides: 1, layout: "faq",
    fields: [{ key: "titulo", label: "Título", max: 50 }, { key: "q1", label: "Pregunta 1", max: 70 }, { key: "a1", label: "Respuesta 1", max: 130, multiline: true }, { key: "q2", label: "Pregunta 2", max: 70 }, { key: "a2", label: "Respuesta 2", max: 130, multiline: true }],
    variants: [
      { titulo: "Primera sesión", q1: "¿Cómo es la primera sesión?", a1: "Es una conversación para conocernos; tú decides cuánto contar.", q2: "¿Cuánto dura?", a2: "50 minutos, online o presencial." },
    ],
  },
  {
    id: "sobre-mi", title: "Sobre mí", description: "Preséntate con tu enfoque y a quién acompañas.", category: "conversion", slides: 1, layout: "text", chip: "etiqueta",
    fields: [{ key: "etiqueta", label: "Etiqueta", max: 24 }, { key: "titulo", label: "Título", max: 60 }, { key: "texto", label: "Presentación", max: 220, multiline: true }],
    variants: [
      { etiqueta: "Sobre mí", titulo: "Hola, soy tu psicóloga", texto: "Trabajo con enfoque {motivo}. Acompaño a adultos y adolescentes en un espacio seguro y sin juicios." },
    ],
    fromTopic: (_t, d) => ({ etiqueta: "Sobre mí", titulo: `Hola, soy ${d.name.replace(/^Ps\.\s*/i, "").split(" ")[0] ?? d.name}`, texto: `${d.title}. Enfoque ${d.approach}. Acompaño a ${d.target_population.toLowerCase()}.` }),
  },
  {
    id: "evento", title: "Taller / Webinar", description: "Invita a un taller psicoeducativo con fecha y botón.", category: "conversion", slides: 1, layout: "text", chip: "fecha", cta: "cta",
    fields: [{ key: "fecha", label: "Fecha", max: 30 }, { key: "titulo", label: "Título", max: 90, multiline: true }, { key: "cta", label: "Botón", max: 30 }],
    variants: [
      { fecha: "Sáb 8 nov · 10:00", titulo: "Taller: herramientas simples para la ansiedad cotidiana", cta: "Reserva tu cupo" },
    ],
    fromTopic: (t) => ({ fecha: "Sáb 8 nov · 10:00", titulo: `Taller: ${cleanTopic(t).toLowerCase()}`, cta: "Reserva tu cupo" }),
  },
];

export type { Fields };
