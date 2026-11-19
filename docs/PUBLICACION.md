# Publicación de la sala y Konva — 19/11/2026

Se revisó el pendiente de E3 contra el Registry publicado (`ecb4263`). El código anterior retiraba los índices de salas expiradas, pero no despertaba ni programaba la purga de los Room cerrados.

La migración ahora guarda una cola durable de los Room cerrados que todavía figuran en el Registry antiguo, antes de liberar sus códigos. Una alarma procesa como máximo tres por ejecución, despierta cada Room para instalar su retención y reintenta errores transitorios. No borra datos inmediatamente ni expone una ruta de mantenimiento pública. Una notificación de estado cuyo código ya no existe deja de reintentarse; la alarma de purga del propio Room se conserva. La prueba SQLite verifica el caso de código expirado y Room cerrado sin alarma.

Límite de la revisión: el código anterior podía haber eliminado índices antes de esta actualización. Los objetos cuyo índice ya se perdió no pueden enumerarse desde el Registry. Su inventario remoto administrativo no se ha efectuado; no se afirma que todos los objetos históricos no indexados hayan sido purgados. No se borraron manualmente datos de producción. La actualización conserva y mejora los controles de acceso actuales.

Verificación previa: test:e10, tipos/build, pruebas de Worker/SQLite y simulación. El perfil de despliegue comprueba correo fatimamendo7@gmail.com y account_id 373df7d753c05ace8818906faae9377f. Vercel: proyecto froebel-pizarra, equipo team_AnoANTSA42d6woe25YIGFOOx; GitHub: lcmhi18/froebel-pizarra, rama main.
