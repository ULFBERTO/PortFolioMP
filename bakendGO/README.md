# Portfolio Backend en Go (PostgreSQL Neon)

Backend desarrollado en Go para el portafolio personal, con persistencia en Neon PostgreSQL, seguridad avanzada (Rate Limiting por IP, protección anti fuerza bruta, JWT, cabeceras de seguridad) y soporte tanto para ejecución local como despliegue Serverless en Vercel.

---

## 🚀 Requisitos Previos

- Go 1.22 o superior
- Base de datos PostgreSQL (Neon)

---

## 🛠️ Configuración (.env)

Crea un archivo `.env` en la raíz de `bakendGO` (puedes basarte en `.env.example`):

```env
DATABASE_URL="postgresql://neondb_owner:npg_zNGjb9v4wVXg@ep-crimson-lab-b4nei89q-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=8080
ADMIN_KEY="mario2024"
JWT_SECRET="tu-clave-secreta-para-jwt"
ALLOWED_ORIGIN="*"
```

---

## 💻 Ejecución Local

1. Descargar dependencias:
   ```bash
   go mod tidy
   ```

2. Iniciar servidor:
   ```bash
   go run cmd/server/main.go
   ```

El servidor iniciará en `http://localhost:8080`. En su primer inicio, creará automáticamente las tablas en Neon y sembrará los datos iniciales desde `seed_data.json`.

---

## 🔒 Seguridad Implementada

1. **Per-IP Rate Limiting**:
   - Tráfico general: límite de peticiones por segundo.
   - Autenticación: máximo 5 intentos fallidos consecutivos por IP. Tras 5 fallos, la IP queda bloqueada temporalmente por 10 minutos (HTTP 429).
2. **Comparación en Tiempo Constante**:
   - `crypto/subtle.ConstantTimeCompare` para prevenir ataques de temporización (timing attacks) sobre la clave de administración.
3. **Sesiones con JWT**:
   - Al autenticar con éxito (`POST /api/auth/verify`), se genera un token JWT firmado de 2 horas.
   - Las modificaciones (`POST /api/portfolio`) requieren el encabezado `Authorization: Bearer <token>`.
4. **Protección contra Cuerpos Grandes (DoS)**:
   - Límite de carga útil a 1 MB mediante `http.MaxBytesReader`.
5. **Cabeceras de Seguridad**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - CORS parametrizable.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/api/health` | Estado del servicio y base de datos | Público |
| `GET` | `/api/portfolio` | Obtiene el portafolio completo | Público (Rate Limited) |
| `POST` | `/api/auth/verify` | Valida clave admin y genera JWT | Público (Estricto Anti-Bruteforce) |
| `POST` / `PUT` | `/api/portfolio` | Actualiza datos del portafolio | Protegido (JWT o Admin Key) |

---

## ☁️ Despliegue en Vercel

1. Instala el CLI de Vercel (si aún no lo tienes):
   ```bash
   npm i -g vercel
   ```

2. Desde la carpeta `bakendGO`:
   ```bash
   vercel
   ```

3. En el dashboard de Vercel (Project Settings > Environment Variables), añade:
   - `DATABASE_URL`: La URL de conexión a Neon.
   - `ADMIN_KEY`: Tu clave para acceder como administrador.
   - `JWT_SECRET`: Una clave secreta larga y aleatoria.
   - `ALLOWED_ORIGIN`: La URL de tu frontend desplegado (ej. `https://mi-portafolio.vercel.app`).

El archivo `vercel.json` y `api/index.go` ya están preparados para ejecutarse como función serverless sin configuración adicional.
