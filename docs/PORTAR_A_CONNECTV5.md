# Cómo unir el módulo de Contenido con Connectv5

Este módulo está hecho para enchufarse. Lo que sigue es el orden de trabajo, con las diferencias reales entre ambos proyectos (verificadas el 30 oct 2026).

## Lo que ya viene resuelto
- **Esquema de base de datos probado**: `supabase/migrations/0001_contenido_studio.sql` (RLS, equipo con rol de editor, aprobación solo del psicólogo, auditoría). `node supabase/tests/contenido.test.mjs` lo ejecuta en un Postgres local y comprueba 17 reglas; se verificó que detecta fallos al romperlo a propósito.
- **Almacenamiento intercambiable**: `src/lib/repo.ts` define `StudioRepo`. Hoy usa `localStorage`; al unir se escribe un adaptador de Supabase y se registra con `setRepo()`.
- **Reglas y pruebas portables** (TypeScript puro, sin React): `src/lib/ethics.ts`, `workflow.ts`, `links.ts`, `package.ts`, `planner.ts`, `api/_lib/brandParse.ts`, y `evals/` (`npm run evals`, 46 casos éticos + flujo + SSRF + paquete).

## Diferencias a resolver
| Tema | Studio (Vite) | Connectv5 (Next 16) | Qué hacer |
|---|---|---|---|
| Usuario | local, sin login | `professionals.id` = `auth.users.id` | `studio_*.user_id` ya apunta a `auth.users`: es el mismo id |
| Slug y dominio de reservas | `dna.slug`, `dna.bookingBase` | `booking_pages.slug` | **Quitar** `studio_profiles.slug`/`booking_base` y leer `booking_pages.slug`; el dominio es el propio sitio |
| Estilo | azul (`brand`), Plus Jakarta Sans | teal, `ui/` propio | Los kits del lienzo son independientes del tema; adaptar solo el cascarón (sidebar, tarjetas) |
| API | `api/*.ts` (funciones Vercel, `POST(Request)`) | Route Handlers de Next | Mover a `src/app/api/copy/route.ts` y `brand/route.ts` (misma firma Web). **Exigir sesión** y límite por usuario |
| Componentes | React 19 sin `"use client"` | App Router | Agregar `"use client"` en `components/studio/*` y `components/app/*` |

## Pasos
1. **Migración**: copiar `0001_contenido_studio.sql` a `Connectv5/supabase/migrations/` (renumerar), ajustar slug como arriba y aplicar en un proyecto de pruebas primero. Correr los advisors de Supabase.
2. **Dependencias**: `html-to-image`, `@google/genai`, `@fontsource/*` (las 9 familias de `src/index.css`), `lucide-react` (ya está).
3. **Copiar**: `src/types/studio.ts`, `src/data/`, `src/lib/` (menos `store.ts` y `repo.ts`), `src/components/studio/`, `src/components/app/{PackageWizard,ApprovalView,CreateView,HomeView,PostsView,BrandView,CalendarView,ui}.tsx` y `evals/`.
4. **Adaptador Supabase**: cargar en un Server Component `studio_profiles` + `studio_posts` y pasar el estado inicial al `useStudio`; `save` como Server Action con debounce. Mapa de columnas: `Post.fields/extras` → jsonb, `scheduledAt` → `scheduled_at`, `approvedAt` → `approved_at` (solo lo escribe el trigger).
5. **Navegación**: agregar «Contenido» y «Aprobación» a `NAV` de `components/sidebar.tsx`.
6. **Medición de reservas por pieza** (lo que justifica el link con seguimiento):
   - Agregar `source text` a `appointments`.
   - En `app/p/[slug]/page.tsx` leer `searchParams.src` y pasarlo a la RPC `public_book` (nuevo parámetro `p_source`), que lo guarda.
   - En Aprobación/Reporte mostrar «reservas por pieza» = `count(appointments) group by source`.
7. **IA**: `GEMINI_API_KEY` solo en servidor; cuota mensual por usuario (tabla `ai_usage`) y registro de tokens y costo por llamada.
8. **Seguridad antes de abrir**: `brand/route.ts` solo para usuarios con sesión (hoy es público en la demo); revisar advisors; no registrar contenido de pacientes.
9. **Pruebas**: `npm run evals` y el test SQL deben pasar en el repo unificado antes de desplegar.

## Fuera de este módulo
Las **boletas SII** las tiene el socio del proyecto; este módulo no las toca. La **publicación directa a Instagram** queda para después (requiere revisión de la app de Meta).
