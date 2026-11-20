# Recta numérica · Primaria → Álgebra

## Etapa 1: diseño y modo individual

Se conserva la actividad de formar enteros con signo y dos dígitos, colocarlos en cualquier marca y recibir una explicación local. Se utilizan los estilos azules, blancos y amarillos de Geometría, conforme a la última indicación del usuario. Fredoka 5.3.0, verificada con `npm view`, se sirve localmente solo en esta página.

Entrada: `src/boards/recta-numerica/index.html`, script y estilos separados. La entrada de Vite se descubre automáticamente. La tarjeta Álgebra de Primaria abre `/boards/recta-numerica/`.

Incluye movimiento de pines, eliminación por toque o al soltarlos en el teclado, cancelación de arrastre, límites de marcas, notas persistentes durante los redibujados, pegado de texto plano e imágenes compatibles de hasta 300 KB y confirmación de Limpiar. Limpiar conserva las notas y la letra. No se expone Deshacer ni el modo Reto. No se modifica `app/` ni se añaden almacenamiento de navegador o servicios de voz.

Esta etapa todavía no registra la pizarra en el manifest de sala. Si se abre con `?room`, muestra el estado pendiente de integración y bloquea la edición para no simular una sala conectada.

## Etapas pendientes, cada una con aprobación

2. Permisos y validación estricta del servidor para pines, marcas, notas y tamaño de letra.
3. Adapter y conexión al motor existente: identificadores del motor, actualizaciones durante los arrastres, notas con debounce y restricciones del alumno.
4. Pruebas de sala, revisión visual disponible y publicación del conjunto.

La revisión visual real y las pruebas de sala no forman parte de los resultados automáticos de esta primera etapa. El proyecto no contiene actualmente la carpeta `app/`.
