# 🏆 Cup26 - Red Social del Mundial 2026

## 📝 Descripción del Proyecto

**Cup26** es el punto de encuentro social y la plataforma de interacción definitiva para los aficionados que esperan el Mundial de Fútbol de 2026. La aplicación busca construir una comunidad activa y entretenida, permitiendo a los usuarios conectar, compartir la emoción de la cuenta regresiva y participar en actividades lúdicas como trivias y encuestas para demostrar su conocimiento y mejorar su estatus dentro de la comunidad.

### ✨ Funcionalidades Clave

* **Feed Social y Dinámico:** Un muro principal que muestra en tiempo real las encuestas creadas por los usuarios.
* **Sistema de Creación de Encuestas:** Cualquier usuario puede crear trivias con 2 a 4 opciones de respuesta.
* **Contador Regresivo:** Un contador visible para el partido inaugural del Mundial 2026.
* **Perfil de Usuario Gamificado:** Perfiles que muestran estadísticas como aciertos y puntos acumulados.
* **Economía Virtual ("FanCoins"):** Gana monedas virtuales por participar y canjéalas por premios estéticos para tu perfil.
* **Leaderboard:** Un ranking que muestra a los usuarios con más respuestas correctas, fomentando una competencia sana.

## 👥 Integrantes

* David Aguilar Acosta - 1961794
* Rebeca Evangelista Jasso - 1972507

## 📁 Estructura de Carpetas

El proyecto está organizado en las siguientes carpetas principales:

```
.
├── backend/
│   ├── models/
│   │   └── user.js         # Modelo de Sequelize para los usuarios
│   ├── database.js         # Configuración de la conexión con Sequelize
│   ├── server.js           # Servidor principal de la API (Express)
│   └── package.json        # Dependencias del backend
│
├── frontend/
│   ├── index.html          # Vista de Login
│   ├── registro.html       # Vista de Registro
│   └── style.css           # Estilos CSS
│
├── database_scripts/
│   └── ScriptDatabaseMySQL.sql # Script para la creación de la BD y tablas
│
└── README.md               # Este archivo
```

* **`/backend`**: Contiene toda la lógica del servidor, la API y la conexión a la base de datos.
* **`/frontend`**: Contiene los archivos HTML, CSS y JavaScript que ve el usuario en el navegador.
* **`/database_scripts`**: Almacena los scripts de SQL necesarios para configurar la base de datos inicial.

## 🚀 Guía de Instalación y Ejecución

Sigue estos pasos para levantar el proyecto en un entorno local.

### Pre-requisitos

* Node.js (v18 o superior)
* NPM (generalmente se instala con Node.js)
* Un gestor de base de datos MySQL (como MySQL Workbench o XAMPP).

### Pasos

1.  **Clonar el repositorio:**
    ```sh
    git clone <URL-DEL-REPOSITORIO>
    cd <NOMBRE-DEL-REPOSITORIO>
    ```

2.  **Configurar la Base de Datos:**
    * Abre tu gestor de MySQL.
    * Ejecuta el script ubicado en `database_scripts/ScriptDatabaseMySQL.sql` para crear la base de datos `cup26_database` y todas las tablas necesarias.

3.  **Instalar dependencias del Backend:**
    * Navega a la carpeta del backend y ejecuta:
    ```sh
    cd backend
    npm install
    ```

4.  **Configurar las variables de entorno:**
    * **Importante:** Dentro de la carpeta `backend`, modifica el archivo `database.js` para asegurar que las credenciales (`user`, `password`) de tu base de datos local sean las correctas.
    ```javascript
    // archivo: backend/database.js
    const sequelize = new Sequelize('CUP26_DATABASE', 'tu_usuario_mysql', 'tu_contraseña_mysql', {
        host: 'localhost',
        dialect: 'mysql'
    });
    ```

5.  **Iniciar el servidor (Backend):**
    * Desde la carpeta `backend`, ejecuta:
    ```sh
    node server.js
    ```
    * Si todo va bien, verás el mensaje: `Servidor API corriendo en http://localhost:3000`.

6.  **Lanzar la aplicación (Frontend):**
    * Abre el archivo `frontend/index.html` en tu navegador web.
    * ¡Listo! Ya puedes registrar un nuevo usuario e iniciar sesión.
