# Reporte de pruebas — Georgia & Paul

Fecha de preparación: 17/10/2026

## Pruebas realizadas

- 29 validaciones automáticas de configuración y archivos: 29/29 correctas.
- Sintaxis de rutas API y librerías Node: correcta.
- Simulación de carga: 80 invitados, 3 clics simultáneos por invitado (240 solicitudes concurrentes): 80 pedidos únicos, 0 pedidos duplicados.
- Carrera de dos bartenders intentando tomar el mismo pedido: 0 conflictos de propiedad en la simulación.
- Flujo completo simulado: 80/80 pedidos entregados, 0 pendientes al terminar.
- Bloqueo de subida de fotos validado tanto en interfaz como en API.
- Galería configurada con un prefijo nuevo (`boda-live/`) para no mostrar las fotos de prueba anteriores.
- Contador configurado para 17/10/2026 20:30 (-05:00).
- `vercel-build` agregado al `package.json`.
- Escrituras de pedidos agrupadas con pipeline de Redis.
- Bloqueo por invitado para evitar pedidos duplicados por doble toque.
- Bloqueo por pedido para evitar que dos bartenders tomen el mismo pedido al mismo tiempo.
- Polling de estado del invitado reducido a 5 segundos para disminuir carga.

## Pruebas que requieren el despliegue real

Estas no pueden validarse completamente sin las credenciales y servicios productivos de Vercel:

1. Vercel Blob: subida real y aparición en galería.
2. Upstash Redis: carga real de pedidos en producción.
3. Web Push: notificaciones en Android/iPhone con pantalla bloqueada.
4. Prueba física con los dos celulares de bartender.
5. Prueba de 80 dispositivos reales conectados a la red del evento.

## Recomendación para el evento

- Mantener Wi‑Fi estable y, de ser posible, un respaldo 4G/5G.
- Los dos bartenders deben abrir `/barra`, iniciar sesión y activar notificaciones antes de que lleguen los invitados.
- Hacer una prueba de pedido completa con 3 celulares antes de abrir el sistema.
