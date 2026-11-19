# Froebel Academy · Pizarra en vivo

**E8: infraestructura verificada localmente.** E1–E6 están implementadas; E7 documenta el límite de integración de Konva. La geometría completa del HTML enviado sigue pendiente de E9/E10. No se afirma que esta pizarra de prueba tenga todas sus opciones. [Alcance](docs/ALCANCE-PIZARRA.md) · [Resultados y limitaciones de E8](docs/E8.md).

## Iniciar localmente

Requiere Node 24 o posterior.

1. `npm install`
2. Copiar `.env.example` a `.env.local` y `worker/.dev.vars.example` a `worker/.dev.vars`. Para el proxy local dejar `VITE_ROOM_API_URL=` vacío. No publicar estos archivos.
3. `npm run build`
4. Terminal 1: `npm run worker:dev` — Worker y estáticos compilados en `http://127.0.0.1:8787`.
5. Terminal 2: `npm run dev` — Vite en `http://127.0.0.1:5174`, con proxy HTTP/WebSocket de `/api`.

Profesor: `/profesor/` crea o reabre una sala y elige la pizarra inicial. Alumno: `/alumno/` introduce código y nombre, espera y entra cuando lo aceptan. El panel del profesor permite aceptar, rechazar, expulsar, cerrar y cambiar la pizarra para toda la clase. Máximo cinco alumnos activos y diez pendientes.

Pizarras disponibles: `/boards/prueba/` (círculos, lápiz, texto y edición) y `/boards/_plantilla/` (segunda pizarra mínima). Sin `?room`, funcionan en modo personal en memoria. En sala, el servidor decide la pizarra; cambiar y volver conserva el estado independiente. Se mantienen las rutas antiguas `/src/pages/...` y `/src/boards/...`.

La creación real requiere la sesión Supabase de un profesor u owner activo en account_access. El botón de prueba solo aparece en desarrollo y requiere LOCAL_TEACHER local. El token del profesor permanece en localStorage y el UUID de alumno en sessionStorage; nunca van en la URL. Una sala cerrada puede reabrirse con su token durante la retención de 24 horas. Las salas recientes corresponden al navegador actual.

## Verificar

- `npm run test:e8`: build con tipos, 85 pruebas automáticas y simulación local completa de un profesor y seis alumnos. La simulación levanta y detiene su propio Worker en 8791, con datos aislados en `.e8-test/`.
- `npm run test:sim`: solo esa simulación, sin navegador, servicios remotos ni despliegue.
- `npm run test:engine`: 24 pruebas del motor, concurrencia y deshacer propio; diff de 500 objetos con límite p95 de 2 ms.
- `npm run test:e2`: 41 pruebas de protocolo, Registry y Room con SQLite local, incluidas cuotas, alarmas, migración y navegación.
- `npm run test:e5`: 14 pruebas del transporte. `node scripts/test-navigation.mjs`: 3 de rutas/historial. `npm run test:scaffold`: 3 de compilación/rutas.
- `npm run worker:check`: empaquetado dry-run, sin desplegar.

El navegador de E8 se verificó con CUA y sus controles Playwright, en dos pestañas; evidencia en docs/E8.md. Los scripts históricos `npm run test:live` y `npm run test:e1` siguen disponibles para ejecución autónoma con Microsoft Edge instalado. Levantan servidores en 8787 y 5190/5193: detener los servidores de desarrollo antes de usarlos. No forman parte de test:e8 y no se ejecutaron en esta entrega. test:live se actualizó a los nombres actuales de controles y la lectura del código de sala.

## Arquitectura y Konva

`src/live/` contiene motor, transporte, attachLive y UI. El protocolo v1 y la lista cerrada de pizarras proceden del manifest. Cada pizarra es una página independiente y entrega un BoardAdapter; [guía de adaptación](docs/PORTAR_PIZARRA.md). Los HTML se descubren desde `src/pages/*/index.html` y `src/boards/*/index.html`.

`app/` no está incorporada y no se modifica. E7 revisó una candidata externa en academia-profesores/app: la App completa no expone el contrato necesario para un adaptador externo simple. `/app-live` no está integrado. El build separado futuro conserva React 18.3.1; no se mezcla con React 19.3.1 de las pantallas de sala. [Resultado de E7](docs/E7.md).

## Despliegue y costos

Esta entrega es local: no incluye push ni despliegue. Antes de publicar, resolver la revisión de objetos históricos cerrados descrita en docs/E3.md y revisar los orígenes autorizados. Construir dist con `npm run build`.

Cloudflare exclusivamente con **fatimamendo7@gmail.com**, cuenta `373df7d753c05ace8818906faae9377f`, mediante `npm run worker:deploy`, que verifica ambos. No usar otro comando para saltar esa comprobación. El frontend debe configurar VITE_ROOM_API_URL con el Worker autorizado y recompilar; las variables Supabase conservan el proyecto indicado por el usuario. Nunca publicar tokens de Cloudflare ni claves secretas en el cliente.

No se activan planes, suscripciones ni servicios de pago. Voz exclusivamente Web Speech API en español. No se han portado las nueve pizarras ni se ha probado capacidad de miles de aulas.
