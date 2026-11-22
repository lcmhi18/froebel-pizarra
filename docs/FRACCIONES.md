# Fracciones de Primaria

Ruta: `/boards/fracciones/`. El catálogo `/aritmetica/` conserva Conjuntos y añade Fracciones. La página no modifica `app/` ni las otras pizarras.

Cuatro temas: partes de diez figuras, comparación con símbolos, operaciones exactas con 2–6 operandos y conversión de decimales exactos/periódicos. La aritmética usa racionales BigInt; división entre cero y 0^0 muestran un mensaje sin producir una respuesta falsa. Enter en Texto crea una línea; Arriba/Abajo alterna exponentes. Dibujos, líneas, texto, fracciones e imágenes se pueden mover y redimensionar. Ctrl+V optimiza las imágenes localmente.

La lección y las anotaciones se sincronizan como campos independientes. En sala solo el profesor escribe; los alumnos admitidos observan. La práctica individual permite cambiar ejercicios. No se añade ningún servicio, narración ni suscripción.

## Criterios adoptados

- Pollo y chocolate usan una superficie rectangular de partes iguales, con textura ilustrada. Las fronteras matemáticas se dibujan con SVG interactivo.
- El rectángulo de 36avos tiene franjas de peso 2, triángulos de peso 3 y celdas de peso 6. Los números no representables con piezas completas se ajustan a la suma posible inmediatamente inferior; la interfaz explica los pesos y muestra el numerador real. Los impropios admiten hasta cuatro figuras.
- La página abre en tema claro, como la referencia; el botón permite cambiar al oscuro. Ocultar/Mostrar cubre respuestas y pasos; se pueden revelar individualmente.
- El HTML autónomo se genera con `scripts/export-fractions.mjs` durante `build:site` y queda en `dist/downloads/Pizarra_de_Fracciones.html`, con fuentes, iconos, comida y código incorporados. La sala requiere la web publicada. El navegador de revisión bloquea `file://`; se verifica el archivo empaquetado y la descarga, sin afirmar una prueba de apertura local.

## Verificación

`npm run test:fracciones`: racionales, precedencia, periódicos, vuelta decimal/fracción para todos los denominadores 1–99, áreas ponderadas y validación de datos. `npm run test:e3`: transmisión a alumnos, imágenes fragmentadas y rechazo de escrituras de alumnos o estados inválidos. Revisión en navegador de cuatro temas, texto multilínea/exponentes, dibujo continuo, movimiento, ocho tiradores, borrador/deshacer, pegado de imágenes y ancho móvil de 390 px.

Texto matemático: al escribir `4/7 + 3/4`, las fracciones se presentan apiladas durante la edición y en el lienzo. Los datos compartidos conservan la escritura original en texto plano, por lo que no cambia el protocolo de sala. Enter inserta otra línea; se conserva el formato de exponentes.
