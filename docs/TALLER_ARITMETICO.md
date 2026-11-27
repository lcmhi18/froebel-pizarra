# Taller de Aritmética de Primaria

Ruta: `/boards/taller-aritmetico/`, con tarjeta propia en `/aritmetica/`. Conserva Conjuntos y Fracciones, sin modificar `app/`.

Incluye MCM y MCD de 2–6 enteros positivos; potencias enteras con exponentes 0–20; operaciones exactas con fracciones, paréntesis y potencias; descomposición en factores primos o valor posicional; conversiones entre bases 2–36; y pizarra libre.

La conversión interpreta primero el número en su base de origen, divide sucesivamente la parte entera y multiplica sucesivamente la parte fraccionaria. Detecta períodos. Cuando una expansión no termina ni repite dentro de 32 cifras, indica expresamente que el resultado mostrado es aproximado. Las entradas de base admiten hasta 24 caracteres; A=10 hasta Z=35. La calculadora de fracciones usa racionales BigInt, un analizador cerrado sin eval y límites explícitos para no bloquear el navegador con potencias excesivas.

El texto reutiliza el editor ya comprobado: `4/7` se apila mientras se escribe, Enter continúa abajo y las flechas ↑/↓ alternan exponente y texto normal. Se conservan dibujo con Pointer Events, líneas, imágenes pegadas con Ctrl+V, movimiento, tamaño, borrador y deshacer. Los menús superior e inferior se ocultan independientemente. El control Pizarra grande amplía el lienzo.

El profesor controla ejercicio y anotaciones en la sala; los alumnos admitidos reciben la misma información sin permiso de escritura. No hay nuevas suscripciones, servicios ni narración externa.

Diseño: se conserva la familia visual azul, blanca y amarilla de Geometría y sus fuentes locales. La superficie principal es el papel cuadriculado donde se resuelve; los pasos y resultados vienen del mismo cálculo. La preferencia del usuario por esta identidad prevalece sobre los estilos genéricos de dashboard de la guía de diseño.

Pruebas: `npm run test:taller` y `npm run test:e3`. Se verifican resultados exactos, signos, precedencia, fracciones como operandos, descomposición, recorridos de bases 2–36, conversiones fraccionarias, estados inválidos y permisos de sala. La revisión de navegador cubre los siete temas, ejemplos, soluciones, fracciones apiladas, Enter, flechas, menús y adaptación del ancho.
