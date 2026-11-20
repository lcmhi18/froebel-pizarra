# Operaciones combinadas con enteros

Nueva página independiente: `/boards/operaciones-combinadas/`. Primaria → Álgebra abre `/algebra/`, un catálogo con la recta numérica y esta pizarra. No se reescriben las pizarras existentes ni `app/`.

## Motor y configuración

`config.js` contiene ejemplos, tarjetas, textos, colores y grosores, además del máximo de 60 pasos y 4096 caracteres por ejercicio. `engine.js` tokeniza y resuelve sin ejecutar la entrada como código. Usa BigInt para mantener exactitud incluso con enteros grandes. Soporta signos Unicode, alias, multiplicación implícita y negación de grupos; rechaza grupos vacíos/mal cerrados, letras, operaciones incompletas, división entre cero o no exacta.

Se resuelve primero el grupo más interno, luego sus multiplicaciones/divisiones y sumas/restas por separado; quitar un grupo es un paso propio. Por eso el ejemplo que da 13 muestra seis pasos: sigue la regla textual, en lugar de comprimirlos a los cuatro del montaje de referencia.

Las notas del procedimiento usan DOM y `textContent`, sin `innerHTML`. La fuente Patrick Hand 5.3.0 fue verificada e instalada localmente. No hay fuentes por CDN, narración externa, puntajes, competencia ni confeti. Ante las instrucciones contradictorias sobre confeti, prevalece la indicación explícita de no incluirlo. La rana reutiliza el recurso ilustrado existente.

## Dibujo y sala

El canvas transparente usa Pointer Events y captura de puntero. Lápiz de 5 px y resaltador de 24 px al 40 %. Las coordenadas se expresan en unidades del ancho, para conservar trazos al crecer la altura. Se redibuja con ResizeObserver y densidad limitada a 2. Cursor local sin trazo; deshacer y borrar solo afectan las anotaciones. Resolver un ejercicio nuevo limpia los trazos.

La sala reutiliza `attachLive`, `RoomEngine` y el panel existentes. Se comparte un campo atómico `lesson: {expression,step}` y elementos `stroke`. Por defecto el profesor controla todo y los alumnos reciben el procedimiento y los trazos en lectura. El servidor vuelve a calcular la validez del ejercicio y el rango del paso, valida los trazos y rechaza todas las operaciones de alumno en esta pizarra. La opción de interacción de alumnos no se habilita en esta versión.

## Verificación

- Motor: 27 pruebas, incluidos los cuatro resultados pedidos (13, −60, −24, −41), errores, enteros grandes y 200 expresiones generadas contrastadas con evaluación independiente.
- Sala: 62 pruebas locales correctas. La prueba específica se amplió y repitió para verificar difusión de trazos y prohibición de borrado/avance por alumnos.
- Navegación y geometría: 17 pruebas correctas, con Primaria → Álgebra → catálogo.
- Compilación completa correcta; tras ajustes visuales finales se reconstruyeron sitio y Konva.
- Navegador real: avance hasta respuesta 13, lápiz y resaltador continuos, deshacer, borrar, entrada por Enter y ejercicio largo en ancho efectivo de 375 px. Documento 375 px y contenido de pizarra igual a su ancho (332 px), sin recorte horizontal. Consola sin errores en la revisión.
- No se probó un dispositivo táctil físico ni una clase autenticada en producción. Los permisos y difusión se verificaron con WebSockets y SQLite del Worker local.

## Revisión visual

final result: passed

Comparación conjunta de la imagen `d52685bf-0c88-48ba-9fb7-6ab3b46d416e.png` y `.e10-test/operaciones-desktop.png`. Conserva la composición de panel a la izquierda y pizarra verde a la derecha, encabezado morado, grupos de colores, resultado amarillo, rana con globo y controles grandes. La referencia contiene varias etapas juntas; la captura muestra el paso 2 real. Se adaptaron las proporciones a 1536 px y la página crece según el procedimiento.

Se corrigió el contraste de las tarjetas y contador en modo oscuro y se verificó de nuevo. Diferencias de detalle: rana reutilizada, iconos Phosphor de línea, sin adornos de estrellas ni nube adicional dentro del tablero. No es una copia píxel por píxel; los adornos no sustituyen las funciones.

## Ajuste solicitado: estilo de Geometría y panel lateral

La última indicación del usuario sustituye la paleta morada y el marco de madera por el estilo azul/blanco/amarillo de Geometría. El procedimiento conserva los grupos coloreados y el resaltado de resultados. El lienzo es blanco y la interfaz mantiene modo oscuro.

El panel dispone de flecha para reducir/expandir y X para ocultar. Al reducirlo queda una barra estrecha; al cerrarlo, el procedimiento usa toda la fila. El botón «Mostrar ¿Por dónde empiezo?» recupera el panel. Es una preferencia local de presentación; no cambia la lección compartida. ResizeObserver adapta el canvas.

Revisión real en 1440 px: ancho del marco aproximado 900.5 px abierto, 1294.8 px reducido y 1388.8 px oculto. Se probó restaurar y avanzar de paso. Compilación completa y 27 pruebas del motor correctas.
