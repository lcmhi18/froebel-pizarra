# Pizarra Konva nueva e independiente

Se creó `/app-live/` dentro de este repositorio, con React y React DOM **18.3.1** y Konva **10.9.1**. No se leyó, copió, editó ni conectó la aplicación de `academia-profesores` durante esta implementación. No se usa su cuenta, autenticación o base de datos. `app/` sigue sin incorporarse.

La decisión del usuario fue crear una página nueva con todas las opciones de la geometría actual. Para conservar esas opciones y cálculos, la página reutiliza el shell, el runtime matemático, el saneado, el adaptador y el motor de sala de **este** proyecto. No se reconstruyeron aproximaciones independientes de las fórmulas.

## Qué es Konva y qué se reutiliza

- React 18 monta una página separada. Su build comprueba las versiones exactas y produce `dist/app-live/index.html` y sus propios assets; no usa el entry React 19 del portal.
- Konva dibuja el lienzo visible: dos capas, cuadrícula y un nodo `Konva.Image` por objeto matemático. Cada objeto se rasteriza desde su SVG saneado, recortado a sus propios límites, con resolución adaptada y máximo 4096 píxeles por lado. Las imágenes se cachean por objeto y se invalidan al cambiar su representación; revisiones impiden que una carga vieja sobrescriba una nueva.
- El SVG interno transparente conserva los controles precisos de vértices, regiones y transportador, además del texto accesible. **No es una reescritura de cada figura como primitivas nativas Konva ni un editor basado en Transformer.** Mantiene los mismos gestos y botones de la geometría actual, con una presentación canvas Konva.
- Las cinco imágenes de fórmulas se cargan exclusivamente desde las rutas locales autorizadas y se incrustan en la representación de ese objeto. No se permiten URLs arbitrarias en ese proceso.
- La sala comparte parámetros e IDs mediante el mismo BoardAdapter y RoomEngine. No transmite bitmaps ni escenas Konva serializadas. `boardId=konva` tiene estado independiente de `geometria`.
- El manifest permite elegir “Geometría Konva” al crear o cambiar de pizarra. “Clase” en modo personal abre `/profesor/?board=konva`.

Konva documenta el uso de SVG en `Konva.Image`: [documentación oficial](https://konvajs.org/docs/sandbox/SVG_On_Canvas.html). Esta implementación conserva los datos matemáticos editables en el adaptador; las imágenes solo son la representación local.

## Desarrollo y construcción

1. `npm install`
2. `npm run build` — construye portal, páginas SVG y nueva página Konva; no modifica `app/`.
3. `npm run worker:dev` — API local en 8787.
4. `npm run dev:konva` — servidor aislado en 5175.
5. `npm run dev` — portal en 5174. Abrir **http://127.0.0.1:5174/app-live/** para conservar navegación y origen autorizado de la sala.

Vite del portal reenvía `/app-live`, incluidos los WebSockets de desarrollo, al servidor separado. El escaneo de dependencias del portal excluye esa entrada y Konva usa un caché separado. Se corrigió un bloqueo de carga/conexión causado por esa separación durante las pruebas. Después de reconstruir dist, reiniciar Wrangler si su catálogo de assets no se actualiza.

## Verificación

- `npm run test:e10`: compilación, tipos, **246 pruebas automáticas** y simulación local de profesor/seis alumnos. Incluye las 244 anteriores y dos nuevas: estado/undo de Konva en el Room real con SQLite, y aislamiento React 18/rutas de assets en la compilación.
- `npm ls react react-dom konva --depth=1`: la página usa 18.3.1, el portal conserva 19.3.1; no se mezclan sus raíces.
- `npm audit --omit=dev`: cero vulnerabilidades de producción en esta revisión. No se ejecutó `audit fix --force` ni una actualización general de herramientas.
- CUA/Playwright: 58 variantes de creación, cuatro formas básicas incluidas; 51 tarjetas de fórmulas insertadas individualmente, esperando a que el canvas termine de representarlas. Cero fallos de representación.
- Círculo reproducido hasta 360°, vértice por arrastre, Deshacer y transportador visibles en Konva.
- Dos pestañas: crear/reabrir sala local, pedir entrada, aceptar alumno, mismo ID y figura en ambos canvas; arrastre del alumno con mismo path en profesor; deshacer el vértice conserva el círculo del profesor.
- Cambiar a geometría SVG muestra su estado vacío independiente; volver a Konva recupera las dos figuras en ambos clientes. Cerrar la sala bloquea los controles del alumno.
- Consola del recorrido final de clase: sin errores ni avisos capturados. Los intentos anteriores durante los reinicios de servidores se trataron como fallos de desarrollo y no como recorridos aprobados.

No se certifica funcionamiento en dispositivos físicos, todos los navegadores o miles de aulas. La resolución de la representación tiene un límite y una pizarra muy grande puede consumir memoria; siguen aplicándose las cuotas de 64 KiB por mensaje y 1 MiB de estado. Los límites visuales frente a la imagen del usuario (iconos/búho 3D) descritos en E9/E10 se mantienen.

Esta entrega es local, sin push, despliegue, nuevos servicios, suscripciones o gastos. Supabase y las reglas de acceso son las del proyecto actual; Cloudflare conserva su verificación de correo/cuenta autorizados. Voz únicamente Web Speech API, si se incorpora.

La compilación final se sirvió mediante Wrangler local en `http://127.0.0.1:8787/app-live/`, con sus encabezados reales. Creó un triángulo con grados, insertó por teclado la fórmula del área del rombo (JPEG local), esperó a la representación canvas y deshizo la inserción. Renderer sin fallos ni cargas pendientes; consola sin errores/avisos. Capturas revisadas de 1672×941 y 390×844 en `.e10-test/konva-desktop.jpg` y `konva-mobile.jpg`. Móvil: ancho visible 390, clientWidth/scrollWidth 375/375, sin desbordamiento horizontal. Log completo: `.e10-test/konva-final.log`. Tras el ajuste final de tipografía se reconstruyó la página Konva y se comprobó esa compilación en navegador.
