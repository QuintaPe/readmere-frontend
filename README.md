# Readmere — Frontend

Lector de EPUBs con vocabulario inteligente y flashcards SRS.
React 19 + TypeScript + Vite + React Router 7 + Tailwind 4 + shadcn/ui. PWA con `vite-plugin-pwa`.

## Requisitos

Node 20+. Variables de entorno en `.env` (no se versiona):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | sí | Proyecto de Supabase (Storage de EPUBs, bucket `books`) |
| `VITE_SUPABASE_ANON_KEY` | sí | Anon key de Supabase |
| `VITE_API_URL` | no | URL del backend (def: `http://localhost:3000/api`) |
| `VITE_GROQ_API_KEY` / `VITE_GEMINI_API_KEY` | no | Claves de IA por defecto; cada usuario puede poner la suya en Ajustes (localStorage) |

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # producción
npm test         # vitest
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Arquitectura

- **Datos:** sin librería de query; `src/lib/query.ts` es una caché
  stale-while-revalidate mínima (invalidar con `invalidateQuery`, limpiar al
  cerrar sesión con `clearQueryCache`).
- **IA:** siempre desde el cliente (`src/lib/ai.functions.ts`) — Groq con
  prioridad, Gemini como fallback, Open Library para metadatos sin clave.
- **SRS:** SM-2 en `src/lib/srs.ts`. `KNOWN_INTERVAL_DAYS = 21` debe coincidir
  con `backend/src/routes/words.ts`.
- **Offline:** EPUBs en IndexedDB (`epub-cache.ts`), repasos pendientes en
  `review-queue.ts` (se sincronizan al volver la conexión).
- **Rutas:** carpetas por feature en `src/routes/`; registro central en
  `src/main.tsx`. Los prefijos `_` (`_authenticated/`, `_admin/`) y `$`
  (`$bookId/`) son solo una convención visual heredada de los routers
  file-based: el router real es React Router declarado a mano, esos
  caracteres no tienen efecto.
- **Auth:** contexts, guard de sesión y acceso al token/impersonación viven
  en `src/auth/` — ningún otro módulo toca las claves de localStorage de
  sesión directamente.
