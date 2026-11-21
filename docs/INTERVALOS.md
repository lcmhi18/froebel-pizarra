# Intervalos en ℤ

Página: `/boards/intervalos/`, publicada en el catálogo de Álgebra de Primaria y en el selector de la sala.

Conserva los tres temas y los 19 ejemplos del HTML de referencia: intervalos y desigualdades; unión e intersección; diferencia, diferencia simétrica y complemento respecto de ℤ. Las operaciones usan tramos de enteros, sin enumerar conjuntos infinitos.

Adopta el diseño claro de Geometría, las fuentes locales, panel de fórmulas con X/flecha, editor de gráficos plegable, menús superior/inferior independientes y pizarra grande. Incluye escritura multilínea del profesor, exponentes, fracciones, fórmulas arrastrables, lápiz, resaltador, grosor, colores, deshacer y borrado. No añade servicios de pago ni generación de voz.

Sala: el profesor comparte expresión, pasos, notas, gráficos (hasta ocho), pintura y fórmulas. El alumno observa; el servidor rechaza sus escrituras y estados inválidos. Los paneles y las herramientas seleccionadas son locales. Se usa la sala y autenticación existentes, sin nuevos recursos Cloudflare. El HTML editable se sanea al recibirlo y los gráficos SVG se generan desde datos validados.

Límites: ejercicios de 2000 caracteres, extremos del ejercicio entre −100000 y 100000; editor gráfico entre −99 y 99, enteros; notas de 8000 caracteres; 1200 puntos y 64 trazos por lienzo; estado compartido hasta 45000 caracteres. Si se excede el estado, aparece aviso en lugar de enviar datos inválidos.

Verificación: `npm run test:intervalos` (34 pruebas, con operaciones contrastadas contra conjuntos enumerados); prueba WebSocket en `tests/e3/recta-permissions.test.ts`; compilación completa. Navegador local: tres pasos con SVG, lápiz continuo, notas multilínea conservadas, paneles y 390 px sin desbordamiento horizontal. La prueba de sala usa el Worker local; no equivale a una clase autenticada en producción.

Resolución automática: detecta el tema desde la operación; A ∪ B / A ∩ B pueden usar los conjuntos activos del editor sin repetir los extremos. Las definiciones escritas explícitamente tienen prioridad. Los errores se indican junto al ejercicio y conservan los pasos y las notas del lienzo.

La barra del editor de gráficos comparte los controles de la barra principal: cursor láser, lápiz y resaltador con grosor/color independientes, siete colores, vista previa, deshacer y borrar trazos. Los trazos conservan el formato compartido de sala. Comprobación en navegador: lápiz continuo, resaltador transparente y borrado sin eliminar los intervalos.
