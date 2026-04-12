# GymControl

---

## Descripción

GymControl es una aplicación web que permite administrar un gimnasio de forma completa:

- Registro y administración de **miembros**
- Asignación y seguimiento de **membresías** (planes Fit y Black)
- Registro de **pagos** por efectivo, tarjeta o transferencia
- **Dashboard** con métricas en tiempo real
- Autenticación segura con sesiones y contraseñas encriptadas

---

## Tecnologías

| Capa          | Tecnología                                  |
| ------------- | ------------------------------------------- |
| Frontend      | HTML, CSS (Vanilla), JavaScript (Fetch API) |
| Backend       | Node.js, Express.js                         |
| Base de datos | MySQL                                       |
| Seguridad     | express-session, bcrypt                     |

---

## Estructura del Proyecto

```
gymcontrol/
├── public/
│   ├── index.html        # Dashboard principal
│   ├── index.css
│   ├── login.html        # Pantalla de autenticación
│   ├── login.css
│   ├── miembros.html     # CRUD de miembros
│   ├── miembros.css
│   ├── membresias.html   # Asignación de planes
│   ├── membresias.css
│   ├── pagos.html        # Registro de pagos
│   └── pagos.css
├── server.js             # Servidor Express + API REST
├── db.js                 # Configuración de conexión MySQL
├── database.sql          # Script DDL de la base de datos
└── package.json
```

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/gymcontrol.git
cd gymcontrol
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

Importa el esquema en MySQL (puedes usar phpMyAdmin o la consola):

```bash
mysql -u root -p < database.sql
```

### 4. Configurar la conexión en `db.js`

```js
const db = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "TU_CONTRASEÑA",
    database: "gymcontrol",
  })
  .promise();
```

### 5. Crear el primer usuario administrador

Accede a `http://localhost:4000/register.html` y regístra tu cuenta. Luego ya puedes iniciar sesión desde `/login.html`.

### 6. Iniciar el servidor

```bash
node server.js
```

La aplicación estará disponible en `http://localhost:4000`.

---

## Base de Datos

```
usuarios    → Administradores del sistema
miembros    → Clientes del gimnasio
planes      → Catálogo de planes (Fit $300 / Black $500)
membresias  → Asignación de planes a miembros (FK: miembro_id, plan_id)
pagos       → Registro de cobros (FK: membresia_id)
```

---

- Las contraseñas se almacenan con **bcrypt** (10 rondas)
- Las rutas del servidor están protegidas con el middleware `requireAuth`
- Las sesiones se manejan del lado del servidor con **express-session**
- Si no hay sesión activa, el servidor devuelve `HTTP 401` y el frontend redirige a login
