const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
const path = require('path');
const sequelize = require('./backend/database');
const User = require('./backend/models/user');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, 'frontend')));

sequelize.sync()
    .then(() => console.log('Tabla de usuarios sincronizada.'))
    .catch(error => console.error('Error al sincronizar la tabla:', error));


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


app.listen(port, () => {
    console.log(`Servidor API corriendo en http://localhost:${port}`);
});