# Froebel Academy · Pizarra en vivo

**Konva nueva disponible localmente en `/app-live/`.** Página independiente con React 18.3.1, las mismas herramientas de geometría y conexión a la sala. Se reutilizan los cálculos de este repositorio; el proyecto de la otra cuenta permanece intacto. [Implementación y límites](docs/KONVA-NUEVA.md). La comparación original de geometría está en [E10](docs/E10.md).

## Iniciar localmente

Requiere Node 24 o posterior.

1. `npm install`
2. Copiar `.env.example` a `.env.local` y `worker/.dev.vars.example` a `worker/.dev.vars`. Para el proxy local dejar `VITE_ROOM_API_URL=` vacío. No publicar estos archivos.
3. `npm run build`
4. Terminal 1: `npm run worker:dev` — Worker y estáticos compilados en `http://127.0.0.1:8787`.
5. Terminal 2: `npm run dev:konva` — página Konva aislada en 5175.
6. Terminal 3: `npm run dev` — Vite en `http://127.0.0.1:5174`, con proxy HTTP/WebSocket de `/api`.

Si reconstruyes `dist/` con Wrangler ya arrancado, reinicia `worker:dev` para recargar el catálogo de assets y las rutas nuevas.

Profesor: `/profesor/` crea o reabre una sala y elige la pizarra inicial. Alumno: `/alumno/` introduce código y nombre, espera y entra cuando lo aceptan. El panel del profesor permite aceptar, rechazar, expulsar, cerrar y cambiar la pizarra para toda la clase. Máximo cinco alumnos activos y diez pendientes.

Pizarras disponibles: `/app-live/` (geometría con canvas Konva y React 18.3.1), `/boards/geometria/` (pizarra completa importada), `/boards/prueba/` (círculos, lápiz, texto y edición) y `/boards/_plantilla/` (segunda pizarra mínima). Sin `?room`, funcionan en modo personal en memoria. En sala, el servidor decide la pizarra; cambiar y volver conserva el estado independiente. Se mantienen las rutas antiguas `/src/pages/...` y `/src/boards/...`.

La creación real requiere la sesión Supabase de un profesor u owner activo en account_access. El botón de prueba solo aparece en desarrollo y requiere LOCAL_TEACHER local. El token del profesor permanece en localStorage y el UUID de alumno en sessionStorage; nunca van en la URL. Una sala cerrada puede reabrirse con su token durante la retención de 24 horas. Las salas recientes corresponden al navegador actual.

## Verificar

- `npm run test:e10`: build, 247 pruebas y simulación; compara construcciones y fórmulas con una referencia offline del HTML original. Ver [geometría](docs/E10.md) y [Konva](docs/KONVA-NUEVA.md).
- `npm run test:e9`: build, 97 pruebas automáticas y simulación local, incluyendo geometría.
- `npm run test:e8`: build con tipos, 89 pruebas automáticas y simulación local completa de un profesor y seis alumnos. La simulación levanta y detiene su propio Worker en 8791, con datos aislados en `.e8-test/`.
- `npm run test:sim`: solo esa simulación, sin navegador, servicios remotos ni despliegue.
- `npm run test:engine`: 24 pruebas del motor, concurrencia y deshacer propio; diff de 500 objetos con límite p95 de 2 ms.
- `npm run test:e2`: 44 pruebas de protocolo, Registry y Room con SQLite local, incluidas cuotas, alarmas, migración y navegación.
- `npm run test:e5`: 14 pruebas del transporte. `node scripts/test-navigation.mjs`: 3 de rutas/historial. `npm run test:scaffold`: 4 de compilación/rutas y aislamiento de Konva.
- `npm run worker:check`: empaquetado dry-run, sin desplegar.

El navegador de E8 se verificó con CUA y sus controles Playwright, en dos pestañas; evidencia en docs/E8.md. Los scripts históricos `npm run test:live` y `npm run test:e1` siguen disponibles para ejecución autónoma con Microsoft Edge instalado. Levantan servidores en 8787 y 5190/5193: detener los servidores de desarrollo antes de usarlos. No forman parte de test:e8 y no se ejecutaron en esta entrega. test:live se actualizó a los nombres actuales de controles y la lectura del código de sala.

## Arquitectura y Konva

`src/live/` contiene motor, transporte, attachLive y UI. El protocolo v1 y la lista cerrada de pizarras proceden del manifest. Cada pizarra es una página independiente y entrega un BoardAdapter; [guía de adaptación](docs/PORTAR_PIZARRA.md). Los HTML se descubren desde `src/pages/*/index.html` y `src/boards/*/index.html`.

`app/` no está incorporada y no se modifica. Tras el spike E7, el usuario eligió una página nueva: `app-live/`, React 18.3.1 y Konva, con build separado y estado propio. El portal conserva React 19.3.1. No se integra la aplicación de la otra cuenta. [Resultado actual](docs/KONVA-NUEVA.md); [spike histórico E7](docs/E7.md).

## Despliegue y costos

La publicación usa https://froebel-pizarra.vercel.app y el Worker autorizado de Fatima. La migración despierta salas antiguas cerradas todavía indexadas para instalar su retención. Los objetos cuyo índice ya eliminó el código anterior requieren inventario administrativo; ver [revisión de publicación](docs/PUBLICACION.md). Construir dist con `npm run build`.

Cloudflare exclusivamente con **fatimamendo7@gmail.com**, cuenta `373df7d753c05ace8818906faae9377f`, mediante `npm run worker:deploy`, que verifica ambos. No usar otro comando para saltar esa comprobación. El frontend debe configurar VITE_ROOM_API_URL con el Worker autorizado y recompilar; las variables Supabase conservan el proyecto indicado por el usuario. Nunca publicar tokens de Cloudflare ni claves secretas en el cliente.

No se activan planes, suscripciones ni servicios de pago. Voz exclusivamente Web Speech API en español. No se han portado las nueve pizarras ni se ha probado capacidad de miles de aulas.
