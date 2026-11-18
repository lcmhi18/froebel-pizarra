# Froebel Academy · Pizarra en vivo

Portada original conservada. Sala nueva con React 19.3.1, React Router 7.18.4, Vite 8.3.5, TypeScript 5.6.3 y Wrangler 4.152.0 (versiones disponibles y fijadas). Worker `academy-profesor-api` con Registry + Room, SQLite y WebSocket Hibernation API. Fecha compatible con el runtime de Wrangler 4.152: 2026-10-26.

## Desarrollo

1. `npm install`
2. Copiar `.env.example` a `.env.local` y `worker/.dev.vars.example` a `worker/.dev.vars`.
3. En una terminal: `npm run worker:dev` (puerto 8787).
4. En otra: `npm run dev` (puerto 5174).
5. Profesor: `/src/pages/profesor/index.html`. Alumno: `/src/pages/alumno/index.html`. Prueba independiente: `/src/boards/prueba/index.html`.

El botón de prueba local solo aparece en desarrollo. Requiere `LOCAL_TEACHER=true` en `.dev.vars` y hostname local; esta variable no se publica. En producción, crear una sala exige una sesión Supabase de una cuenta activa `teacher` u `owner` en `account_access`. Las credenciales de la sala viajan en el primer mensaje de WebSocket, nunca en la URL.

## Compilar y probar

- `npm run build`: comprobación TypeScript de frontend y Worker + compilación de las cuatro páginas HTML.
- `npm run worker:check`: empaquetado de Worker sin despliegue.
- `npm run test:engine`: concurrencia, deshacer por usuario, limpiar/deshacer y exclusión de opciones locales.
- `npm run test:live`: levanta Wrangler local y Vite; prueba SQLite/WebSockets reales y Edge en 1440, 768 y 390 px. Usa puertos 8787/5190 y datos temporales en `.live-test/` (ignorado por Git). Requiere Edge instalado.

## Desplegar

Cloudflare exclusivamente con **fatimamendo7@gmail.com**, perfil `froebel-fatima`, cuenta `373df7d753c05ace8818906faae9377f`. Nunca desplegar con milenahi263@gmail.com.

1. Conectar si falta: `npx wrangler auth create froebel-fatima`.
2. `npm run worker:deploy`: activa el perfil solo para este directorio, comprueba correo y cuenta y despliega. Se detiene si no coinciden. No usar `wrangler deploy` directo para omitir esta comprobación.
3. Configurar en Vercel `VITE_ROOM_API_URL` con la URL HTTPS del Worker y volver a desplegar el frontend. `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` deben seguir apuntando a la BD indicada. No incluir claves secretas.
4. Nuevos dominios del frontend deben añadirse a `ALLOWED_ORIGINS` en `worker/wrangler.jsonc` antes de desplegar el Worker.

No se activan planes de pago ni servicios de narración. Si se añade voz, usar solo Web Speech API en español.

## Conectar otra pizarra

Implementar `src/live/BoardAdapter.ts`: estado normalizado con IDs estables, `getState`, `setState`, `applyRemote`, `localKeys` y `onChange`. `setState/applyRemote` no generan historial local ni vuelven a emitir cambios. Emitir `onChange(false)` durante el arrastre y `onChange(true)` al soltar. Usar IDs `${author}:${crypto.randomUUID()}`. El motor difiere por ID, aplica inmediatamente lo local, confirma secuencias del servidor y guarda hasta 60 acciones propias para deshacer. Los cambios concurrentes posteriores de otro usuario no se revierten al deshacer una propiedad.

La pizarra de prueba es SVG + JS/React (círculos movibles, lápiz, texto, tamaño, color, Gemelo, borrar y limpiar). No usa almacenamiento del navegador. Solo las pantallas de sala guardan studentId/teacherToken en sessionStorage; el código se mantiene en la URL. La sesión Supabase preexistente mantiene su almacenamiento habitual en la portada.

`app/` y las nueve pizarras reales no existen en este checkout y no se han creado, portado ni reescrito. Cuando se incorporen, `app/` debe conservar React 18.3.1 + Konva como entrada/página y paquete aislados, para no mezclar sus versiones de React con las pantallas nuevas.

## Persistencia y límites

El Registry reserva códigos sin 0/O/1/I/L. Al cerrar conserva la reserva 24 h; después puede reutilizarla con una instancia Room nueva, de modo que el token viejo no controle otra sala. La sala se puede reabrir dentro de ese plazo mediante `/api/rooms/:code/reopen` y teacherToken. El servidor guarda el hash SHA-256 del token, estado, alumnos y operaciones. Compacta el snapshot cada 200 operaciones; conserva el registro para deduplicación. Los updates sobre objetos eliminados se descartan. Restablecer un objeto ajeno con Deshacer crea una copia con ID propio.

Se aplican 64 KiB por mensaje entrante, 60 operaciones/s/socket, 5 alumnos activos, 2 MB de estado y 2000 objetos por sala. El cliente limita el envío a 2 ops/40 ms, fracciona lotes y snapshots grandes. Ping/pong cada 25 s; el servidor usa respuesta automática compatible con hibernación.

## Validación

Probado localmente: pendientes sin snapshot, mensajes de moderación manipulados, profesor falso, límite 5, rechazar, expulsar, reingreso pendiente, reconexión activa, duplicados, secuencia/autores, updates tras eliminar, compactación SQLite, límites de tamaño/frecuencia, cerrar/reabrir con token, dibujo bidireccional, deshacer propio y limpiar/deshacer, tema oscuro y tres tamaños sin desbordamiento ni errores de consola.

No comprobado todavía: las nueve pizarras reales, integración con `app/`, corte físico de red en varios dispositivos, expulsión real del runtime por hibernación, liberación transcurridas 24 horas reales y carga prolongada. Las pruebas locales de creación usan el bypass explícito; falta verificar crear sala con una cuenta docente real en producción.

Referencia de arquitectura: [SQLite de Durable Objects](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) y [WebSockets con hibernación](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

## Pantallas de cursos
Primaria y Secundaria reutilizan los dos diseños suministrados en src/assets/img/cursos. En móvil se apilan Geometría y Aritmética. Para comprobar navegación, imágenes y consola: node scripts/test-courses.mjs. Detalle de fidelidad en design-qa.md.
