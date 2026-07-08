# Frontend - Portal de Reservas de Pádel

Este proyecto es la interfaz de usuario (Frontend) desarrollada en **Angular v21** para el sistema de gestión de reservas de la cancha de pádel de la Municipalidad de Aldea San Antonio.

---

## 📂 Estructura Principal del Proyecto

La aplicación está organizada en componentes modulares bajo la ruta `src/app/`:

* **`reservas/`**: Calendario interactivo del usuario donde se eligen fechas y se visualizan los horarios libres, leyendo tarifas dinámicas del backend.
* **`recepcionista/`**: Panel especial para que la recepcionista pueda verificar y aprobar los comprobantes de pago recibidos y actualizar el precio de la cancha en tiempo real.
* **`superadmin/`**: Panel del súper administrador. Contiene:
  * **Dashboard Estadístico:** Indicadores dinámicos de turnos, estado de reservas y ranking del Top 5 de usuarios.
  * **Gestión de Usuarios:** Listado de usuarios con selector desplegable de roles y bloqueo administrativo.
* **`carrito/`**: Sección de compras donde se acumulan las solicitudes de turnos seleccionadas antes de proceder a registrarlas.
* **`misreservas/`**: Historial personal donde cada usuario puede ver sus reservas pendientes y aprobadas, o cancelarlas si aún están a tiempo.
* **`login/` y `registro/`**: Flujo de inicio de sesión y creación de cuentas (con envío automático de correos de verificación).

---

## 💻 Desarrollo Local y Conexión con la API

Dado que el frontend utiliza rutas de API relativas (como `/api/reservas`), es necesario redirigirlas al puerto del backend local (`http://localhost:8080`) durante el desarrollo.

### 1. Requisitos:
* Tener instalado el CLI de Angular globalmente:
  ```bash
  npm install -g @angular/cli
  ```

### 2. Configurar Proxy de Desarrollo:
Crear un archivo llamado `proxy.conf.json` en la raíz del frontend (`frontend-reservas/`) con el siguiente contenido:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

### 3. Iniciar Servidor de Desarrollo:
Ejecuta el servidor cargando la configuración del proxy:
```bash
ng serve --proxy-config proxy.conf.json
```
Navega a `http://localhost:4200/`. Cualquier consulta a `/api/...` será redirigida automáticamente al backend de Node.js en el puerto `8080`.

---

## 📦 Compilación y Despliegue en Producción

Cuando la aplicación vaya a ser desplegada en el servidor del cliente (ej: bajo el subdominio municipal `/reservas`):

### 1. Construir el paquete optimizado indicando Base Href:
```bash
ng build --base-href /reservas/
```
Esto creará los archivos estáticos listos para producción en la carpeta `dist/frontend-reservas/browser/`.

### 2. Copiar al directorio público de Nginx en el servidor:
```bash
sudo cp -r dist/frontend-reservas/browser/* /var/www/frontend/browser/
sudo systemctl reload nginx
```
