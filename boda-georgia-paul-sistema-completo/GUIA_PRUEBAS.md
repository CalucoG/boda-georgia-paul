# Sistema completo de barra — Georgia & Paul

## Qué hace

### Invitados
- Entran a `/cocteles`.
- Escriben su nombre.
- Eligen bebida.
- Pulsa **Pedir cóctel**.
- Reciben un código, por ejemplo `A37`.
- Ven el estado: **Pedido recibido → En preparación → Entregado**.

### Bartender 1 y Bartender 2
- Entran a `/barra`.
- Inician sesión con sus propios usuarios.
- Pulsa **Activar notificaciones**.
- Cuando entra un pedido, ambos reciben una notificación push.
- El primero que pulsa **Tomar pedido** se queda con la orden.
- El segundo bartender ve que ya está siendo preparada.
- El bartender que la tomó pulsa **Marcar entregado**.

### Control central de consumo
- El número de bebidas alcohólicas entregadas se guarda en Redis.
- Después de una bebida alcohólica, el servidor aplica una espera de 20 minutos.
- Agua y mocktails no incrementan el contador alcohólico.
- El bartender ve cuántas bebidas alcohólicas se han entregado antes de ese pedido.
- A partir de 3, la tarjeta del bartender muestra una advertencia visual.
- El sistema ayuda a organizar el servicio; la decisión final de servir siempre es del bartender.

---

# Configuración antes de probar

## 1. Base de datos

Crear una base de datos **Upstash Redis** desde Vercel Marketplace / Storage.

Necesitas estas variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 2. Variables privadas de Vercel

Usa el archivo separado `CONFIGURACION_PRIVADA_BODA.txt`.

No lo copies dentro de GitHub.

Agregar en:
**Vercel → Proyecto → Settings → Environment Variables**

Luego hacer un nuevo deploy.

## 3. Vercel Blob

Mantener la conexión de Blob que ya usas para Fotos y Galería.

## 4. Notificaciones

### Android / Chrome
1. Abrir `/barra`.
2. Iniciar sesión.
3. Pulsar **Activar notificaciones**.
4. Aceptar permiso.
5. Bloquear el celular y realizar un pedido desde otro dispositivo.

### iPhone
Web Push funciona mejor instalando la web en pantalla de inicio:
1. Abrir `/barra` en Safari.
2. Compartir → **Añadir a pantalla de inicio**.
3. Abrir la app instalada.
4. Iniciar sesión.
5. Pulsar **Activar notificaciones**.

---

# Prueba recomendada

Usar 3 celulares:

- Celular A: invitado.
- Celular B: bartender1.
- Celular C: bartender2.

1. Activar notificaciones en B y C.
2. Desde A pedir un Mojito.
3. B y C deben recibir la notificación.
4. B pulsa **Tomar pedido**.
5. En C debe aparecer “Por bartender1”.
6. En A debe cambiar a “En preparación · bartender1”.
7. B pulsa **Marcar entregado**.
8. En A debe cambiar a “Entregado”.
9. Intentar pedir inmediatamente otra bebida alcohólica.
10. El servidor debe indicar el tiempo restante.
11. Probar Agua o Mocktail.
12. Subir una foto y revisar Galería.

---

# Rutas

- `/` Inicio
- `/fotos` Fotos
- `/galeria` Galería
- `/cocteles` Pedidos de barra
- `/barra` Acceso bartender
