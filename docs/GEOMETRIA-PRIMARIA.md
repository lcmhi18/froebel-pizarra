# Geometría de Primaria: entrada y pintura

La tarjeta **Primaria → Geometría** ahora abre `/app-live/`, la pizarra completa con presentación Konva. El título visible y el selector de sala dicen “Geometría de Primaria”. Secundaria conserva `/boards/geometria/`. No cambian la autenticación del portal, las cuentas ni el protocolo de sala.

Se corrigió un fallo de pintura heredado del saneado: las regiones del balde se calculan localmente como imágenes PNG y sus `href` se eliminaban antes de dibujarlas. El saneado y el renderer Konva ahora comparten una validación que admite las cinco fórmulas JPG locales y PNG base64 con cabecera IHDR, dimensiones acotadas y hasta 1,5 millones de píxeles. Se rechazan datos SVG/HTML, URLs externas y rutas arbitrarias. Los PNG son representación derivada; la sala sigue compartiendo parámetros de pintura, no imágenes rasterizadas.

## Comprobación

- `npm run test:e10`: build/tipos, **253 pruebas automáticas** y simulación local de profesor/seis alumnos.
- Seis pruebas nuevas: handlers reales del portal con proveedor de autenticación simulado (Primaria, Secundaria y acceso sin sesión); imágenes permitidas; URLs inseguras; dimensiones y tamaño desmesurados.
- CUA/Playwright local: cuadrado con diagonal AC, región superior roja e inferior azul, ambas visibles simultáneamente. El PNG saneado se conserva y Konva termina sin fallos ni cargas pendientes. Deshacer retira el último relleno y conserva el anterior. Sin errores/avisos de consola capturados.
- El botón Clase abre `/profesor/?board=konva` con “Geometría de Primaria” seleccionada.

La prueba del recorrido del portal usa un proveedor falso **offline**, no una sesión Supabase real. No se afirma una prueba de login real ni de todas las combinaciones posibles en todos los dispositivos. Las pruebas de E9/E10 y de Konva documentan el resto de las herramientas y la sala.

El límite de uso impidió inicialmente abrir el navegador; después del restablecimiento se completaron las comprobaciones de navegador indicadas. Los primeros clics de diagnóstico sobre un borde del triángulo pintaron ese borde; la verificación de regiones independientes se hizo sobre un cuadrado con diagonal completa, que sí delimita dos zonas cerradas.
