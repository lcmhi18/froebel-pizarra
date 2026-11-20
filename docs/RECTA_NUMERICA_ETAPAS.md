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

## Etapas pendientes, cada una con aprobación

3. Adapter y conexión al motor existente: identificadores del motor, actualizaciones durante los arrastres, notas con debounce y restricciones del alumno.
4. Pruebas de sala, revisión visual disponible y publicación del conjunto.

La revisión visual real y las pruebas de sala no forman parte de los resultados automáticos de esta primera etapa. El proyecto no contiene actualmente la carpeta `app/`.
