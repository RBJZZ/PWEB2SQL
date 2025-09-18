// 1. Importar dependencias
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Para permitir peticiones desde el frontend
const path = require('path');
const sequelize = require('./database');
const User = require('./models/user');

// 2. Configurar el servidor Express
const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Habilita CORS para todas las rutas
app.use(bodyParser.json()); // AHORA USAMOS JSON
app.use(express.static(path.join(__dirname, '../frontend'))); // Servir archivos estáticos del frontend

// 3. Sincronizar la base de datos
// Esto crea la tabla si no existe, basado en tu modelo de Sequelize
sequelize.sync()
    .then(() => console.log('Tabla de usuarios sincronizada.'))
    .catch(error => console.error('Error al sincronizar la tabla:', error));

// 4. Rutas de la API

// --- Ruta para el registro de usuarios ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }

    try {
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario usando el modelo de Sequelize
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: `¡Registro exitoso, ${newUser.username}! Ahora puedes iniciar sesión.` });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El nombre de usuario o el email ya existen.' });
        }
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
});

// --- Ruta para el inicio de sesión ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }

    try {
        // Buscar al usuario por email con Sequelize
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }

        // Comparar la contraseña ingresada con la almacenada
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.status(200).json({ message: `¡Bienvenido de nuevo, ${user.username}!` });
        } else {
            res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
});

// 5. Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor API corriendo en http://localhost:${port}`);
});