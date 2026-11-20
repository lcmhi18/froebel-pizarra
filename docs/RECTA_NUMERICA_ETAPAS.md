# Recta numérica · Primaria → Álgebra

## Etapa 1: diseño y modo individual

Se conserva la actividad de formar enteros con signo y dos dígitos, colocarlos en cualquier marca y recibir una explicación local. Se utilizan los estilos azules, blancos y amarillos de Geometría, conforme a la última indicación del usuario. Fredoka 5.3.0, verificada con `npm view`, se sirve localmente solo en esta página.

Entrada: `src/boards/recta-numerica/index.html`, script y estilos separados. La entrada de Vite se descubre automáticamente. La tarjeta Álgebra de Primaria abre `/boards/recta-numerica/`.

Incluye movimiento de pines, eliminación por toque o al soltarlos en el teclado, cancelación de arrastre, límites de marcas, notas persistentes durante los redibujados, pegado de texto plano e imágenes compatibles de hasta 300 KB y confirmación de Limpiar. Limpiar conserva las notas y la letra. No se expone Deshacer ni el modo Reto. No se modifica `app/` ni se añaden almacenamiento de navegador o servicios de voz.

Esta etapa todavía no registra la pizarra en el manifest de sala. Si se abre con `?room`, muestra el estado pendiente de integración y bloquea la edición para no simular una sala conectada.

## Etapa 2: permisos y validación del servidor

La recta numérica queda registrada en el manifest y dispone de una tabla de permisos compartida. El servidor valida cada operación autenticada antes de aplicarla: solo pines con `t/n/v`, movimientos con `v`, marcas enteras 0–20, letra par 12–72 y notas como bloques de texto o imagen. Las imágenes deben tener un formato permitido, una cabecera coherente y un tamaño de hasta 300 KB. Un alumno no puede modificar `note` ni `fs`.

La validación del estado final ocurre dentro de la misma transacción SQLite que escribe las operaciones. Una suma de marcas igual a cero o más de 200 pines revierte el lote completo. Las demás pizarras mantienen sus permisos anteriores.

Controles de la etapa: `npm run test:e2` (57 pruebas), `npm run test:engine` (24 pruebas) y `npm run build`, correctos. Son pruebas automatizadas locales; todavía no se verificó la interfaz conectada en un navegador real ni se desplegó esta etapa.

Verificado con pruebas locales de WebSocket/SQLite, incluidos mensajes prohibidos, valores inválidos, difusión a alumnos activos, exclusión de pendientes y reversión de lotes. El cliente sigue mostrando el aviso de integración pendiente cuando recibe `?room`: conectarlo corresponde a la etapa 3. Esta etapa no se publica por separado.

Limitación a resolver al integrar notas: el protocolo mantiene su tope existente de 64 KB por mensaje de cliente. La validación de imágenes de hasta 300 KB no elimina ese límite de transporte; las notas grandes todavía no cuentan con un mecanismo de envío compatible. No se modificaron estos límites ni se añadió almacenamiento externo.

## Etapa 3: adapter y conexión al motor existente

La entrada ya utiliza `NumberLineAdapter` y `attachLive`, tanto en modo personal como con `?room`. Se reutilizan el motor, la conexión, el panel y las reglas de sala. Los pines usan identificadores del motor y su payload contiene únicamente `t/n/v`; moverlos cambia solo `v`. Formar el número y los mensajes de ayuda permanecen locales. Los arrastres usan el throttle de 40 ms del motor y publican su posición final. Si se cancela un arrastre que ya difundió posiciones intermedias, se publica la posición original para que los demás participantes también recuperen el pin.

Las notas se envían con debounce de 300 ms y se conservan durante cambios de marcas y redibujados. Los ecos propios no reemplazan el contenido del editor ni su nodo. El alumno recibe notas y tamaño de letra, pero no los puede editar. Pendiente, pausa y cierre bloquean la edición mediante el motor y el adapter.

Para conservar los 64 KB por mensaje y admitir imágenes de hasta 300 KB, el protocolo v1 incorpora el mensaje aditivo `ops_chunk`. Solo el profesor puede subir fragmentos; una carga por socket, ordenada, con máximo de estado de 1 MB más 64 KB de envoltorio y caducidad de 30 segundos. Los fragmentos se guardan temporalmente en SQLite, sobreviven a hibernación y se borran al completarse, caducar, cambiar de pizarra o desconectarse. No se incorporan servicios ni almacenamiento externo. Al ensamblarse, la operación pasa por la autenticación, permisos, límites y transacción habituales; los clientes antiguos siguen enviando `ops` normales. Los fragmentos conservan pares de sustitutos Unicode completos.

Verificación local: `npm run build` correcto; `test:recta` 17 pruebas, `test:e5` 15, `test:e2` 61 y `test:engine` 24: **117 pruebas correctas**. Incluyen adapter y motor reales conectados por WebSocket con el Worker local, movimiento de un pin ajeno, notas, limpieza, restauración al cambiar de pizarra y pausa al desconectar al profesor. También incluyen carga fragmentada con hibernación, expiración, alumno prohibido, fragmentos incompletos, imagen de 300 KB y rechazo de notas inválidas. La prueba de imagen comprueba transporte y validación de cabecera/tamaño, no decodificación visual. Las pruebas de interacción usan un DOM simulado explícito; no equivalen a una prueba de navegador.

No se ha realizado revisión visual real ni probado el portapapeles nativo: el navegador local continúa no disponible para la herramienta. Esta etapa queda guardada localmente, sin push ni despliegue.

## Etapa pendiente, con aprobación

4. Verificación final de sala, revisión visual si está disponible y publicación del conjunto.

La revisión visual real y las pruebas de sala no forman parte de los resultados automáticos de esta primera etapa. El proyecto no contiene actualmente la carpeta `app/`.

## Etapa 4: revisión final y publicación autorizada

El usuario confirmó la etapa y luego cambió explícitamente la referencia visual: ahora se utiliza el diseño tropical de la imagen original, en lugar del diseño de Geometría. Se conserva la lógica de sala y el adapter. Se añadieron fondo y rana ilustrados, servidos localmente como WebP (aproximadamente 229 KB entre ambos), marcos marrones, teclado verde y pines tipo marcador. La revisión visual está documentada en `design-qa.md`.

Compilación correcta después del cambio visual y 17 pruebas de recta correctas. La etapa 3 ya verificó 117 pruebas de permisos, transporte, motor e integración. También pasaron las 3 pruebas de navegación. Se revisaron en navegador real la colocación de +7, notas multilínea, controles y distribución móvil. No se verificó una clase autenticada en producción ni el pegado nativo de imágenes.

Cloudflare: identidad comprobada como fatimamendo7@gmail.com, account_id 373df7d753c05ace8818906faae9377f. Publicación mediante `npm run worker:deploy`, que vuelve a comprobar ambos. Vercel: proyecto froebel-pizarra, repositorio lcmhi18/froebel-pizarra, rama main.
