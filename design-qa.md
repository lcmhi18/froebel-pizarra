# QA: pantallas de Primaria y Secundaria

## Fuente y estado

- Primaria: adjunto `C:/Users/LuzCr/AppData/Local/Temp/codex-clipboard-cdc6dece-7040-41c9-a865-dc7a827ddbb9.png`.
- Secundaria: adjunto `C:/Users/LuzCr/AppData/Local/Temp/codex-clipboard-02d30b4e-f444-4859-af1e-5778d84d2aa8.png`.
- Ambas fuentes: 1891 x 831 píxeles. Implementación: viewport CSS 1891 x 831, deviceScaleFactor 1, capturas 1891 x 831; mismo estado tras pulsar el nivel correspondiente y sesión docente simulada.
- Capturas: `.course-test/primaria-desktop.png` y `.course-test/secundaria-desktop.png`.
- Comparación conjunta: `.course-test/primaria-comparison.png` y `.course-test/secundaria-comparison.png`, referencia a la izquierda e implementación a la derecha. Ambas se reducen al mismo tamaño, 945 x 416, solo para inspección conjunta.
- Detalle a escala 1:1: `.course-test/primaria-detail.png` y `.course-test/secundaria-detail.png`, recorte de 725 x 425 de la tarjeta Geometría de fuente e implementación en una sola imagen.
- Responsive: `.course-test/primaria-768.png`, `secundaria-768.png`, `primaria-390.png` y `secundaria-390.png`. No se suministró referencia móvil; se conserva el orden y se apilan las mismas tarjetas completas.

## Findings

No quedan diferencias accionables P0/P1/P2. Se conservaron textos, ilustraciones, proporciones, colores y fondos de las referencias mediante recursos WebP suministrados, sin generar imágenes nuevas. Controles de Volver y tarjetas son botones reales etiquetados para teclado y lectores de pantalla.

- Tipografía: los títulos, logotipos y rótulos forman parte de las imágenes originales, conservados sin sustituir por fuentes aproximadas. Los mensajes de contenido vacío son texto accesible.
- Espaciado: cabecera de 85 px y sidebar de 325 px al ancho de referencia; región principal de 1566 x 746. Las tarjetas mantienen la composición original de escritorio. En móvil se apilan sin recortar el contenido.
- Colores/tokens: mismas imágenes y fondo azul de la aplicación. No se introduce una paleta nueva.
- Imágenes: reutilización de los adjuntos a WebP calidad 96. [P3] Hay la variación mínima esperable de compresión frente a los PNG fuente.
- Contenido: Primaria corresponde a la primera imagen y Secundaria a la segunda; Geometría y Aritmética conservan sus nombres. Los cursos muestran un estado vacío honesto y el enlace existente a la pizarra de prueba; no se inventan pizarras disponibles.

## Comparación e interacciones

Primera revisión: las comparaciones de escritorio y sus detalles coincidían; en la captura de tablet de 768 px se detectó [P2] un estiramiento vertical del sidebar. Se fijaron su altura y alineación a la proporción original, sin estirar el dibujo hasta el alto completo del viewport. La segunda ejecución de test-courses volvió a capturar ambas pantallas en los tres tamaños y pasó navegación, ausencia de desbordamiento y consola.

`node scripts/test-courses.mjs`: aprobado. Comprueba sesión simulada, ambos niveles, botones Geometría/Aritmética, volver al nivel, volver a Inicio, 1891/768/390, ausencia de overflow y errores de consola. No se crearon usuarios reales. `npm run build`: aprobado.

## Implementation checklist

- [x] Primaria abre el primer diseño.
- [x] Secundaria abre el segundo diseño.
- [x] Recursos WebP dentro del proyecto y enlaces de controles funcionales.
- [x] Pantallas móviles verificadas sin desbordamiento.
- [x] Comparación visual conjunta y revisión de detalle.

final result: passed
