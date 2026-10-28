# Connect Clinical Studio (prototipo)

Editor de contenido para psicólogos con guardrails de marca y de ética. Vite + React 19 + TypeScript + Tailwind 4. Estado en `localStorage`.

- `npm run dev` — todo funciona sin keys (la IA cae al banco local de variantes).
- `npm run check:kits` — audita el contraste WCAG AA de los 4 kits.
- IA real: `api/copy.ts` (función de Vercel) usa `GEMINI_API_KEY` solo en servidor. Probar con `vercel dev`.
- Export: PNG/JPEG a 1080×1920 (story), 1080×1080 o 1080×1350 con `html-to-image`.
- Pendiente: login + Supabase, publicar a Instagram, más kits (hoy 4 de 20), foto como formato propio, límites de uso en `/api/copy`.


## Versión final (fusión)

Une dos prototipos propios sin modificarlos:

- **Base y UI/UX:** `connect-studio` (editor tipo Stories, Brand Kits con contraste AA, revisión ética que bloquea el export, Feed Harmonizer 3×3, Antes vs. Después, teleprompter).
- **Funciones traídas de `spotli-connect`:** 8 formatos nuevos (13 en total), plan semanal por pilares con calendario, descripción de Instagram (IA o texto base), estado y fecha por pieza, y «Analizar mi web» para deducir el Clinical DNA.
- **No se trajeron a propósito:** *Testimonio* y *Promoción* (chocan con las reglas éticas: testimonios de pacientes y tono comercial), y las plantillas de foto (Studio ya tiene capas de imagen).
- **Un solo `api/copy.ts`** reemplaza a `api/fill.ts`. Sin `GEMINI_API_KEY` responde 503 y la app usa los bancos locales.
- Los datos viven en `localStorage` (`connect-studio-final-v1`); hereda `connect-studio-v1` si existe. No se migran los datos de `spotli-connect` (otro modelo).

Respaldos: etiqueta `backup-pre-merge` en `connect-studio` (`vicentegandaram/connect-clinical-studio`) y en `spotli-connect` (`vicentegandaram/connect-studio`).
