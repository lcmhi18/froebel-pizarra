# Portar una pizarra SVG a la sala

No es necesario reescribir su dibujo, sus figuras ni sus herramientas. La sala solo conoce BoardAdapter. Las reglas de permisos, cupos, aceptación y cierre viven en el Worker.

## 1. Normalizar el estado

Devuelve `{items, order, fields}` desde `getState()`: items es un mapa por ID estable, order contiene esos IDs y fields contiene parámetros compartidos que no pertenecen a un objeto. Conserva referencias de objetos no modificados; nunca mutes un snapshot que ya devolviste. El motor usa esas referencias y una caché estructural para evitar comparar todo el contenido en cada movimiento.

Si el programa original guarda un array, conviértelo al leer y reconstruye su array al aplicar estado. Guarda la referencia normalizada hasta la siguiente modificación real. El adapter de prueba muestra una implementación sin React en `src/boards/prueba/adapter.ts`.

## 2. Aplicar cambios remotos sin ecos

Implementa `setState(state)` y `applyRemote(ops)` llamando al dibujo existente bajo una bandera de aplicación remota. No dispares onChange, guardado ni historial local durante esa aplicación. `applyOperation` está disponible en `src/shared/operations.ts` para patches v1.

## 3. Avisar de acciones y gestos

`onChange(callback)` devuelve una función de desuscripción. Notifica `callback(false)` en movimientos de arrastre/deslizador y `callback(true)` al soltar, incluso si el último valor no cambió. Para acciones discretas usa `callback(true)`. No añadas otro throttle: el motor agrupa a unos 40 ms, asigna un gestureId y emite el final.

## 4. Separar parámetros compartidos e interfaz local

Comparte objetos geométricos, rellenos de sus caras y parámetros como ángulo/desarrollo del objeto. Mantén local herramienta activa, color elegido para futuros objetos, selección, pestaña, imán, opciones ocultas y modo grande. Incluye sus claves en `localKeys` si están dentro de fields; también pueden vivir fuera del estado compartido.

El color aplicado a un objeto sí forma parte de items. Una animación comparte sus parámetros, no un frame por operación: cada navegador calcula sus fotogramas a partir de esos parámetros.

## 5. Solo lectura

`setReadOnly(true)` impide iniciar o confirmar modificaciones de usuario. Bloquea también los gestos ya iniciados, los atajos, Gemelo, Borrar y Limpiar. Redibujar estado recibido sigue permitido. No implementes permisos de alumno/profesor en la pizarra: el servidor decide, y attach activa este modo durante espera, pausa, reconexión o cierre.

## 6. Exponer el contrato

```ts
window.FroebelBoard = { id: 'prueba', adapter };
const live = attachLive(adapter, {
  boardId: 'prueba',
  workspace: document.querySelector('main'),
});
```

Carga `attachLive` desde `src/live/attach.ts`. Un `<div id="live-slot"></div>` en la cabecera coloca allí Sala o el chip del alumno. Si falta, attach añade un control flotante. Se puede pasar slot y workspace explícitamente. El panel se monta junto al workspace y lo reduce; en móvil se coloca encima, sin cubrir el lienzo. Los estilos de sala están aislados en Shadow DOM y usan Nunito autohospedada únicamente en su interfaz.

## 7. IDs y deshacer

Sustituye contadores por `live.engine.newId()`. Conserva el ID al mover, pintar o restaurar un objeto; Gemelo crea uno nuevo. Conecta el botón Deshacer a `live.engine.undo()`. Limpiar solo elimina los objetos y notifica un commit: el motor lo agrupa y permite restaurarlos con los mismos IDs sin revertir acciones ajenas.

## 8. Modo personal

Sin `?room=CODIGO`, attach no crea conexión, no lee credenciales ni guarda la pizarra. Activa un historial exclusivamente local sobre el mismo motor. Una recarga inicia una pizarra nueva. Con room, el estado pertenece al Room y el servidor lo entrega por snapshot.

Los objetos no usan localStorage/sessionStorage. El transporte guarda únicamente las credenciales de sala indicadas en la especificación, y su interfaz guarda la preferencia de tema. Ningún token va en la URL. Los nombres y textos se insertan con textContent, nunca como HTML.

## 9. Páginas y manifiesto

Cada pizarra tiene su propio `src/boards/<id>/index.html`, con script absoluto `/src/boards/<id>/main.ts`. Vite descubre el HTML y el build crea `/boards/<id>/`. Registra una pizarra en BOARD_MANIFEST solo cuando esté habilitada para salas; esto también amplía la lista cerrada que valida el Worker.

La plantilla mínima de E5 está en `_plantilla/` y funciona en modo personal. Su registro como segunda pizarra y la navegación de toda la clase corresponden a E6. Si se abre con room antes de registrarla, ofrece un enlace a la pizarra de prueba; no se conecta silenciosamente al estado de otra pizarra.

## 10. Limpieza, tema y voz

Si se desmonta la página manualmente, llama `live.destroy()`. attach suspende/reanuda las conexiones al entrar/salir del historial de página del navegador. Sus componentes respetan tema claro/oscuro y guardan el override de sala. El papel de la pizarra de prueba permanece blanco en ambos temas para que todos vean los mismos colores de los objetos.

Si añades narración, usa exclusivamente Web Speech API en español. No incorpores servicios de voz externos, créditos ni suscripciones.

## Lista de comprobación

- [ ] IDs estables; Gemelo usa newId y restaurar conserva el ID.
- [ ] getState es inmutable; objetos no modificados reutilizan referencias.
- [ ] setState/applyRemote redibujan sin commits ni historial.
- [ ] Todas las acciones notifican y los gestos envían un final.
- [ ] localKeys excluyen la interfaz; rellenos del objeto se comparten.
- [ ] Solo lectura bloquea ratón, táctil, teclado y acciones laterales.
- [ ] Solo funciona sin red de sala y sin guardar objetos en el navegador.
- [ ] Un profesor y un alumno aceptado convergen; pendientes no reciben objetos.
- [ ] Deshacer y Limpiar preservan IDs y cambios ajenos.
- [ ] Tema, controles de 44 px, foco y móvil se comprueban en navegador.

No se toca app/ ni se convierten las pizarras SVG a Konva.
