# Pizarra de álgebra

Ruta: `/boards/algebra-completa/`, accesible desde el catálogo `/algebra/`.

Adapta el HTML de referencia a módulos Vite y al diseño claro de Geometría. Incluye siete temas, resolución paso a paso, modo profesor con escritura multilínea, exponentes, fracciones, fórmulas arrastrables y dibujo. Las fuentes están alojadas localmente. El HTML generado pasa por DOMPurify.

Es una pizarra personal: no incorpora sincronización de sala ni servicios externos. Los algoritmos cubren los patrones de los siete temas; rechazan entradas incompatibles y resultados numéricos fuera del rango entero seguro.

Validación: `npm run test:algebra` comprueba los 21 ejemplos por equivalencia numérica independiente, exponentes cero y entradas inválidas (31 pruebas). Navegador local: navegación de pasos y persistencia del texto multilínea al comprobar pasos.
