# Froebel Academy · Pizarra en vivo

Nuevo alcance por etapas: **E1 y E2 preparadas y probadas localmente**. El nuevo contrato v1 está definido; su activación en Room se hará en E3. Cada etapa requiere aprobación y commit. Pruebas y límites en [docs/E2.md](docs/E2.md).

## Desarrollo local

Requiere Node 24 o posterior. Las versiones principales se mantienen fijadas: React 19.3.1, React Router 7.18.4, Vite 8.3.5, TypeScript 5.6.3 y Wrangler 4.152.0.

1. `npm install`
2. Copiar `.env.example` a `.env.local`. Dejar `VITE_ROOM_API_URL=` vacío para el proxy local. Copiar `worker/.dev.vars.example` a `worker/.dev.vars` únicamente para pruebas locales.
3. `npm run build` (prepara `dist/` antes de iniciar los assets de Wrangler).
4. Terminal 1: `npm run worker:dev` — Worker local y estáticos en `http://127.0.0.1:8787`.
5. Terminal 2: `npm run dev` — Vite en `http://127.0.0.1:5174`, con proxy HTTP/WebSocket de `/api` al Worker.

Páginas: `/profesor/`, `/alumno/`, `/boards/prueba/`. Se conservan las rutas anteriores `/src/pages/...` y `/src/boards/...`. Los inputs HTML se descubren desde `src/pages/*/index.html` y `src/boards/*/index.html`.

## Comprobaciones

- `npm run build`: TypeScript de frontend, herramientas y workspace del Worker; build multipágina y aliases públicos.
- `npm run test:e2`: validadores v1, Registry SQLite, cuotas, alarmas y migración; Vitest + pool de Cloudflare local.
- `npm run test:scaffold`: descubrimiento de páginas y salidas de compilación.
- `npm run test:e1`: Wrangler local, recursos estáticos, prioridad de API, proxy HTTP/WebSocket y navegador.
- `npm run worker:check`: empaquetado sin despliegue.
- `npm run test:engine` y `npm run test:live`: pruebas de regresión de la sala base. `node scripts/test-courses.mjs`: pantallas de cursos.

## Workspaces y app/

`worker/` es el workspace `@froebel/worker`; `app/` queda reservado en la configuración, pero **sus archivos no están disponibles**. No se crea ni modifica esa carpeta. `vite.app.config.ts` es una configuración externa para la futura salida `dist/app/`. `npm run build:app` omite el build si falta `app/package.json`; cuando exista, exige React y React DOM 18.3.1 resueltos desde ese paquete antes de compilar. E7 revisó una candidata externa en academia-profesores/app y documentó la falta de un contrato externo para App completa; /app-live no está integrado. Ver [docs/E7.md](docs/E7.md).

## Publicación y costos

E1 se prueba localmente: no publica ni activa planes. El despliegue futuro será exclusivamente en `fatimamendo7@gmail.com`, mediante `npm run worker:deploy`, que verifica perfil y cuenta. Antes habrá que reconstruir `dist/` con `npm run build`. No usar claves secretas en el frontend ni publicar `.env.local` o `.dev.vars`.

El Worker tiene preparados `assets`, `ASSETS` y `run_worker_first` para `/api/*`. Los cambios en retención, Registry y protocolo se implementarán en sus etapas. No se portan las nueve pizarras ni se modifica `app/`. Voz: solo Web Speech API en español, sin servicios de narración de pago.

Detalles de la implementación anterior: [docs/SALA-BASE.md](docs/SALA-BASE.md). Revisión visual de los cursos: [design-qa.md](design-qa.md).
