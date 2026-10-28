import type { FormatDef, FormatId, Fields } from "../types/studio";
import { cleanTopic, EXTRA_FORMATS } from "./formats-extra";

const CORE: FormatDef[] = [
  {
    id: "mito-realidad",
    topicKey: "mito",
    fromTopic: (t) => ({ mito: `«${cleanTopic(t)}.»`, realidad: "La evidencia muestra que acompañarse con un profesional suele ser un paso de cuidado, no de debilidad." }),
    title: "Mito vs. Realidad",
    description: "Desestigmatiza una creencia común con una respuesta psicoeducativa.",
    category: "educativo",
    slides: 1,
    fields: [
      { key: "mito", label: "Mito", max: 120, multiline: true },
      { key: "realidad", label: "Realidad", max: 220, multiline: true },
    ],
    variants: [
      { mito: "«Ir a terapia significa que no pudiste solo/a.»", realidad: "Pedir un espacio profesional para procesar lo que vives es un acto de cuidado, no una falta de fortaleza." },
      { mito: "«La terapia sirve para no volver a sentir {motivo}.»", realidad: "La meta no es eliminar emociones, sino ganar herramientas para atravesarlas sin que te desborden." },
      { mito: "«Si no es grave, no vale la pena consultar.»", realidad: "No hace falta tocar fondo para pedir apoyo. Consultar a tiempo también es una forma de cuidarte." },
    ],
  },
  {
    id: "carrusel-psicoeducativo",
    topicKey: "titulo",
    title: "Carrusel · Checklist de 3 pasos",
    description: "Portada, 3 pasos prácticos y cierre con invitación a guardar.",
    category: "educativo",
    slides: 5,
    fields: [
      { key: "titulo", label: "Título de portada", max: 90, multiline: true },
      { key: "paso1", label: "Paso 1", max: 110, multiline: true },
      { key: "paso2", label: "Paso 2", max: 110, multiline: true },
      { key: "paso3", label: "Paso 3", max: 110, multiline: true },
      { key: "cierre", label: "Cierre", max: 110, multiline: true },
    ],
    variants: [
      { titulo: "3 pasos para poner un límite sin culpa", paso1: "Nombra lo que sientes: «esto me incomoda».", paso2: "Di lo que necesitas en una frase corta y clara.", paso3: "Tolera la incomodidad inicial: no significa que estés fallando.", cierre: "Guarda este post para cuando lo necesites." },
      { titulo: "¿{motivo}? Revisa estos 3 puntos hoy", paso1: "Suelta la mandíbula y baja los hombros.", paso2: "Exhala más lento de lo que inhalaste, tres veces.", paso3: "Pregúntate: ¿qué necesito ahora mismo, aunque sea pequeño?", cierre: "Si se repite seguido, conversarlo con un profesional ayuda." },
      { titulo: "Cansado vs. agotado emocionalmente", paso1: "Dormir no te devuelve la energía.", paso2: "Lo pequeño te irrita más de lo habitual.", paso3: "Cuesta sentir alegría ante lo bueno.", cierre: "Si te reconoces, no estás solo/a. Guarda este post." },
    ],
  },
  {
    id: "frase-validacion",
    title: "Frase de validación",
    description: "Una idea breve que contiene y se comparte.",
    category: "emocional",
    slides: 1,
    fields: [
      { key: "frase", label: "Frase", max: 150, multiline: true },
      { key: "apoyo", label: "Línea de apoyo (opcional)", max: 100 },
    ],
    variants: [
      { frase: "Tus emociones no son un defecto que reparar: son señales que escuchar.", apoyo: "Respira hondo tres veces." },
      { frase: "No tienes que tener resuelta toda tu vida en este segundo.", apoyo: "Un paso pequeño también cuenta." },
      { frase: "Poner un límite también es una forma de cuidar el vínculo.", apoyo: "" },
    ],
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad / cupos",
    description: "Anuncia cupos de forma sobria, con sticker «Agenda en mi bio».",
    category: "conversion",
    slides: 1,
    fields: [
      { key: "titulo", label: "Titular", max: 80, multiline: true },
      { key: "detalle", label: "Detalle", max: 160, multiline: true },
      { key: "mes", label: "Periodo", max: 24 },
      { key: "cupos", label: "Cupos", max: 12 },
    ],
    variants: [
      { titulo: "Abro cupos para terapia individual online", detalle: "Acompañamiento en {motivo}. Agenda tu primera sesión en el link de mi bio.", mes: "Noviembre", cupos: "3 cupos" },
      { titulo: "¿Sientes que es momento de ordenar lo que llevas dentro?", detalle: "Modalidad online, 1 a 1. Consulta disponibilidad en el link de mi bio.", mes: "Este mes", cupos: "2 cupos" },
    ],
  },
  {
    id: "guion-reel",
    title: "Guion para Reel",
    description: "4 fases listas para teleprompter: gancho, psicoeducación, micro-ejercicio y cierre ético.",
    category: "video",
    slides: 1,
    fields: [
      { key: "gancho", label: "1 · Gancho empático (0–5 s)", hint: "Nombra la experiencia, no la patologiza.", max: 160, multiline: true },
      { key: "explicacion", label: "2 · Explicación psicoeducativa", max: 420, multiline: true },
      { key: "ejercicio", label: "3 · Micro-ejercicio", max: 320, multiline: true },
      { key: "cierre", label: "4 · Cierre ético", hint: "Invita a consultar sin prometer resultados.", max: 260, multiline: true },
    ],
    variants: [
      {
        gancho: "¿Te despiertas a las 3 de la mañana con la mente a mil? No eres la única persona.",
        explicacion: "Cuando llevamos mucho en la cabeza, el cuerpo puede quedarse en alerta aunque estemos durmiendo. No siempre es algo grave, pero es una señal de que estás cargando más de lo que alcanzas a soltar durante el día.",
        ejercicio: "Prueba esto: apoya una mano en el pecho, suelta la mandíbula y exhala más lento de lo que inhalas. Tres veces. Solo notar, sin exigirte dormirte.",
        cierre: "Si esto se repite seguido, conversarlo con un profesional puede ayudar. Este contenido es informativo y no reemplaza una terapia. Mi link para agendar está en mi perfil.",
      },
      {
        gancho: "Decir «no» no te hace una mala persona. Te lo explico en un minuto.",
        explicacion: "Poner un límite informa a los demás cómo cuidar el vínculo contigo. La culpa que aparece al principio es común y no prueba que estés haciendo algo mal.",
        ejercicio: "Antes de responder, respira una vez y completa: «Lo que necesito es…». Dilo en una frase corta.",
        cierre: "Si poner límites te cuesta mucho, se puede trabajar en terapia. Este contenido no reemplaza una atención profesional.",
      },
    ],
  },
];

export const FORMATS: FormatDef[] = [...CORE, ...EXTRA_FORMATS];

export const FORMAT_BY_ID: Record<FormatId, FormatDef> = Object.fromEntries(FORMATS.map((f) => [f.id, f])) as Record<FormatId, FormatDef>;

export function fillVariant(variant: Fields, concern: string): Fields {
  const motivo = concern.trim() || "lo que te preocupa";
  return Object.fromEntries(Object.entries(variant).map(([k, v]) => [k, v.replaceAll("{motivo}", motivo)]));
}
