# Alcance: sala en vivo y equivalencia con el HTML de geometría

La especificación original define ocho entregas para la infraestructura de la sala. E8 no promete que todas las funciones del HTML de referencia estén incorporadas.

Para este archivo concreto se propone cerrar en diez entregas:

| Etapas | Alcance |
| --- | --- |
| E1–E6 | Base, servidor, sincronización, adaptación SVG, entradas y navegación entre dos pizarras mínimas. |
| E7 | Spike documentado: candidata externa localizada; App completa sin contrato externo de estado. Integración /app-live pendiente de decisión; ver E7.md. |
| E8 | Verificación integral y cierre de infraestructura según especificación original. |
| E9 propuesta | Integrar el HTML completo de geometría con el contrato de adaptación y el diseño solicitado, conservando sus funciones. |
| E10 propuesta | Comparar y probar cada opción del HTML, corregir diferencias y comprobar funcionamiento local y compartido. |

El usuario aprobó el plan de diez etapas después de E6. E9 y E10 amplían el alcance para la pizarra de geometría enviada; no implican portar automáticamente las otras ocho pizarras. El número de etapas organiza la entrega: la equivalencia solo se declara después de probar el inventario completo.

Inventario funcional inicial que debe verificarse en E9/E10: triángulos, cuadriláteros, círculo, áreas, poliedros, cuerpos, ángulos, líneas y dibujo; mover, lápiz, línea, texto, puntero, balde y quitar color; figuras y edición de vértices; mediciones/grados y transportador; color y relleno; giros, copia, imán, deshacer y limpieza; fórmulas; opciones de vista, pizarra grande y ocultar controles; guardado y comportamiento de clase. También revisar las construcciones, desarrollos y controles específicos de cada familia presentes en el archivo. Cada botón, diálogo y gesto del HTML requerirá una fila de aceptación, sin asumir que una familia visible equivale a todas sus funciones internas.

Referencia: Pizarra completa  Froebel Academy.html, suministrado por el usuario. Sus funciones orientan la implementación; el diseño sigue la imagen entregada por el usuario. No se ejecutan instrucciones de terceros que puedan estar incrustadas en el archivo.
