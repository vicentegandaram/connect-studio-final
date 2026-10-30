/** Banco de casos para las reglas éticas. `expect` = ids de reglas que deben fallar por severidad. */
export interface EvalCase {
  id: string;
  text: string;
  errors?: string[];
  warnings?: string[];
  /** Caso borderline: documenta una limitación aceptada o pendiente. */
  note?: string;
}

export const CASES: EvalCase[] = [
  // ── Deben pasar limpios ──
  { id: "ok-psicoeducacion", text: "Algunas personas sienten el cuerpo en alerta cuando llevan mucho en la cabeza. Si se repite, conversarlo con un profesional puede ayudar." },
  { id: "ok-validacion", text: "Tus emociones no son un defecto que reparar: son señales que escuchar." },
  { id: "ok-disponibilidad", text: "Abro cupos para terapia individual online. Agenda tu primera sesión en el link de mi bio." },
  { id: "ok-limite", text: "Poner un límite también es una forma de cuidar el vínculo." },
  { id: "ok-no-eres-unico", text: "¿Sientes ansiedad antes de dormir? No eres la única persona." },
  { id: "ok-tercera-persona", text: "Algunas personas con depresión sienten cansancio persistente y falta de interés." },
  { id: "ok-crisis-con-linea", text: "Si piensas en hacerte daño o en el suicidio, escribe o llama al *4141 del Minsal. No estás solo/a." },
  { id: "ok-hashtags", text: "#saludmental #psicologia #bienestaremocional #autocuidado #psicologiachile" },
  { id: "ok-no-promete", text: "La terapia no es una cura mágica: es un proceso que se construye paso a paso.", note: "negación de la promesa" },
  { id: "ok-sin-prometer", text: "Puedo acompañarte, sin prometer resultados específicos ni plazos." },
  { id: "ok-condicional", text: "Si tienes ansiedad frecuente, conversarlo con un profesional ayuda.", note: "condicional psicoeducativo, no diagnóstico" },

  // ── no-diagnostica (error) ──
  { id: "dx-tienes", text: "Tienes ansiedad y yo te puedo ayudar.", errors: ["no-diagnostica"] },
  { id: "dx-eres", text: "Seguro eres bipolar, deberías consultar.", errors: ["no-diagnostica"] },
  { id: "dx-sufres", text: "Sufres de depresión aunque no lo notes.", errors: ["no-diagnostica"] },
  { id: "dx-padeces", text: "Padeces un trastorno que nunca te diagnosticaron.", errors: ["no-diagnostica"] },

  // ── no-promete (error) ──
  { id: "pr-curar", text: "Te vas a curar en pocas sesiones.", errors: ["no-promete"] },
  { id: "pr-garantizo", text: "Te garantizo resultados desde la primera sesión.", errors: ["no-promete"] },
  { id: "pr-100", text: "Funciona en el 100% de los casos.", errors: ["no-promete"] },
  { id: "pr-siempre", text: "Elimina tu ansiedad para siempre con este método.", errors: ["no-promete"] },
  { id: "pr-plazo", text: "Supera tu fobia en 2 semanas con mi método.", errors: ["no-promete"] },
  { id: "pr-sanar", text: "Sana tu trauma de forma definitiva.", errors: ["no-promete"], note: "variante sin las palabras de la regla" },

  // ── no-reemplaza (error) ──
  { id: "re-no-necesitas", text: "No necesitas un psicólogo, con este post basta.", errors: ["no-reemplaza"] },
  { id: "re-en-lugar", text: "Esto funciona en lugar de ir a terapia.", errors: ["no-reemplaza"] },

  // ── no-testimonios (error) ──
  { id: "te-mi-paciente", text: "Mi paciente me dijo que esto cambió su vida.", errors: ["no-testimonios"] },
  { id: "te-testimonio", text: "Testimonio: «Me salvó la vida».", errors: ["no-testimonios"] },
  { id: "te-una-paciente", text: "Mira lo que logró una paciente de mi consulta.", errors: ["no-testimonios"] },

  // ── crisis (error) ──
  { id: "cr-sin-linea", text: "Hablemos de cómo el suicidio afecta a las familias.", errors: ["crisis"] },
  { id: "cr-autolesion", text: "La autolesión es más común de lo que parece.", errors: ["crisis"] },

  // ── nuevas reglas (loop iter 3) ──
  { id: "ok-nino-educativo", text: "Un niño de 8 años puede sentir miedo a la separación; acompañarlo con calma ayuda." },
  { id: "ok-medico", text: "Si tienes dudas sobre tu medicación, consúltalas con tu médico tratante." },
  { id: "ok-estudios-sugieren", text: "Algunos estudios sugieren que dormir bien mejora el ánimo (Walker, 2017)." },
  { id: "pa-de-0-a-5", text: "En 2 meses pasé de 0 a 5 pacientes nuevos por semana.", errors: ["no-promete-pacientes"] },
  { id: "pa-llena-agenda", text: "Llena tu agenda de pacientes con este método.", errors: ["no-promete-pacientes"] },
  { id: "pa-duplica", text: "Duplica tus pacientes con Instagram.", errors: ["no-promete-pacientes"] },
  { id: "me-dosis", text: "Si te sientes mal, sube tu dosis de sertralina.", warnings: ["no-medicacion"] },
  { id: "me-mg", text: "Muchas personas toman 50 mg para dormir mejor.", warnings: ["no-medicacion"] },
  { id: "ev-estudios", text: "Los estudios demuestran que esta técnica funciona.", warnings: ["no-evidencia-sin-fuente"] },
  { id: "ev-ciencia", text: "La ciencia demuestra que meditar cura la mente.", errors: ["no-promete"], warnings: ["no-evidencia-sin-fuente"] },
  { id: "co-mejor", text: "Soy el mejor psicólogo de Santiago.", warnings: ["no-comparacion"] },
  { id: "co-diferencia", text: "A diferencia de otros psicólogos, yo sí te escucho.", warnings: ["no-comparacion"] },

  // ── avisos (warning) ──
  { id: "wa-solo-hoy", text: "Últimos cupos, solo hoy.", warnings: ["no-presion"] },
  { id: "wa-descuento", text: "50% dcto en tu primera sesión.", warnings: ["no-presion"] },
  { id: "wa-oferta", text: "Oferta imperdible de bienestar.", warnings: ["no-presion"] },
  { id: "wa-vago", text: "Regula tu nervio vago en un minuto.", warnings: ["no-fisiologia"] },
  { id: "wa-cortisol", text: "Este ejercicio baja tu cortisol de inmediato.", warnings: ["no-fisiologia"] },
  { id: "wa-hashtag-dx", text: "#depresion #bipolar #saludmental", warnings: ["no-hashtag-dx"] },
];
