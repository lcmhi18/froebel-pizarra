# Froebel Academy Teens · Profesores

Copia del proyecto vecino `froebel-academy-teens`: mismos estilos, imágenes WebP, opciones y estructura `src/games/matematica/primaria` y `src/games/matematica/secundaria`.

## Ejecutar

`npm install` y `npm run dev`. Para producción: `npm run build`.

La configuración local y de ejemplo apunta a `https://zlcpyrisqigmfayufmnm.supabase.co` con su clave publicable para navegador. No incluir claves secretas.

## Profesores

Inicio de sesión y registro mediante Supabase Auth. El registro incluye `account_type: teacher` solo como información de la solicitud, nunca como autorización. La autorización se consulta en `public.account_access`: debe existir una cuenta `teacher` u `owner` con estado `active`. Las cuentas nuevas requieren confirmación por correo según la configuración de Auth y activación por el administrador. No se cambia el esquema existente ni se conceden permisos desde el navegador.

El proyecto original aún no contiene juegos: se conserva el mensaje correspondiente. Inicio y Cursos mantienen el comportamiento del original.

Voz: si se añade narración, utilizar únicamente Web Speech API, en español, sin servicios ni créditos adicionales.
