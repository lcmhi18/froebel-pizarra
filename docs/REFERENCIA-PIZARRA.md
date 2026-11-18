# Referencia funcional y visual de la futura pizarra

Referencia proporcionada por el usuario al autorizar E2. Se ha leído como ejemplo de funcionalidades; no se ejecutó el HTML ni se copió a los assets publicados.

- Archivo: `Pizarra completa  Froebel Academy.html`, 522630 bytes.
- SHA-256: `6a7d35c4bd742c31a3ba40eec2903dc18e3e1d86861c54aa1bea6a935a022fd4`.
- Referencia visual: adjunto `codex-clipboard-96796617-2e75-480c-a7fc-5f27a09cfe21.png`.
- Instrucción: usar las funcionalidades como guía; el diseño debe ser diferente al del HTML y orientarse por la imagen adjunta. No sustituir este requisito por una copia visual del HTML.

## Inventario funcional

| Área | Funciones observadas |
|---|---|
| Familias | Triángulos, cuadriláteros, círculo, áreas, poliedros, cuerpos, ángulos, líneas y dibujo |
| Herramientas | Mover, lápiz, línea, texto, puntero, balde y quitar color |
| Construcción | Vértices arrastrables, figuras, tamaños, giro, relleno, etiquetas y medidas |
| Instrumentos | Transportador móvil, tamaño del transportador, cuadrícula, imán |
| Objetos complejos | Colores por cara/arista/vértice, desarrollo de cuerpos, rotación y animaciones |
| Fórmulas | Galería por categorías, selección y colocación de fórmulas como objetos |
| Edición | Gemelo/copiar, borrar, limpiar y deshacer |
| Interfaz | Ocultar opciones, pizarra grande y ayuda didáctica |

## Lo que se debe adaptar, no copiar directamente

- Estado principal: `S.items` es un arreglo y los IDs se generan con un contador `S.n`. El adaptador futuro lo normalizará por IDs estables del motor; el orden será independiente.
- `S.pr` contiene el transportador; debe decidirse explícitamente qué parámetros compartidos corresponden a fields. Herramienta activa, color vigente, selección, pestaña, imán y opciones de interfaz permanecen locales. El color de un objeto sí se comparte.
- El historial actual H guarda el arreglo entero con JSON. En la sala se usará el deshacer por usuario/gesto del motor, preservando lo ajeno y el mismo ID al restaurar, según E4.
- `draw()` se envuelve con un guardado remoto diferido de dos segundos. En un adaptador, aplicar cambios remotos no debe disparar guardado, historial ni onChange.
- La parte de clase usa `window.claude.use`, documentos work/meta y una pizarra por alumno con vistas de otras en solo lectura. Esa integración no se trasladará al backend de Cloudflare. La nueva sala tiene un mismo lienzo editable para profesor y alumnos aceptados.
- La referencia construye partes de SVG/UI mediante innerHTML. Los datos de usuarios de la sala nueva se mostrarán como texto plano; no se interpolarán nombres ni tokens en HTML.
- Las animaciones deben compartir sus parámetros y ejecutar localmente los fotogramas derivados, evitando enviar una operación por cada fotograma.

## Dirección visual de la imagen

Marca Froebel, cabecera azul, familias geométricas y herramientas en filas, lienzo cuadriculado amplio y barra inferior de colores/acciones con mascota. La imagen orienta la composición y el lenguaje de la futura pizarra; no se introduce ni se genera diseño nuevo en E2.

La implementación visual/adaptador se abordará en su etapa autorizada. Se mantienen app/ y las nueve pizarras reales sin modificar. Cualquier narración utilizará únicamente Web Speech API, sin servicios de pago.
