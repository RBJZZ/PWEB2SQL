const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

// 1. Se importa el objeto 'db' centralizado desde la carpeta de modelos.
// Este objeto ya contiene todos los modelos y sus relaciones definidas.
const db = require('./backend/models');

// 2. Se accede a los modelos a través del objeto 'db' para mayor claridad.
const User = db.User;
const Publicacion = db.Publicacion;
const Opcion = db.Opcion;
const Voto = db.Voto;

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// --- Ruta para el Registro de Usuarios ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Usamos los nombres del MODELO: 'username' y 'password'
        const newUser = await User.create({
            username, // El modelo lo mapeará a 'nombre_usuario'
            email,
            password: hashedPassword // El modelo lo mapeará a 'password_hash'
        });

        res.status(201).json({ message: `¡Registro exitoso, ${newUser.username}! Ahora puedes iniciar sesión.` });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El nombre de usuario o el email ya existen.' });
        }
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
});

// --- Ruta para el Inicio de Sesión ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            res.status(200).json({
                message: `¡Bienvenido de nuevo, ${user.nombre_usuario}!`,
                user: {
                    id: user.id,
                    username: user.nombre_usuario, 
                    email: user.email
                }
            });
        } else {
            res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
});

// --- Ruta para obtener todas las publicaciones ---
app.get('/api/publicaciones', async (req, res) => {
    try {
        const publicaciones = await Publicacion.findAll({
            include: [
                { model: User, attributes: ['nombre_usuario'] }, 
                { model: Opcion } 
            ],
            order: [['id', 'DESC']] 
        });
        res.status(200).json(publicaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al obtener publicaciones.', error: error.message });
    }
});

// --- Ruta para crear una nueva publicación ---
app.post('/api/publicaciones', async (req, res) => {
    const { usuario_id, texto_pregunta, opciones } = req.body;

    if (!usuario_id || !texto_pregunta || !opciones || opciones.length < 2) {
        return res.status(400).json({ message: 'Datos incompletos para crear la publicación.' });
    }

    const t = await db.sequelize.transaction(); 

    try {
        const nuevaPublicacion = await Publicacion.create({
            usuario_id,
            texto_pregunta
        }, { transaction: t });

        const opcionesACrear = opciones.map(opcion => ({
            publicacion_id: nuevaPublicacion.id,
            texto_opcion: opcion.texto,
            es_correcta: opcion.es_correcta || false
        }));

        await Opcion.bulkCreate(opcionesACrear, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Publicación creada exitosamente.' });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Error al crear la publicación.', error: error.message });
    }
});

db.sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`Servidor API corriendo en http://localhost:${port}`);
        });
    })
    .catch(error => console.error('Error al sincronizar las tablas:', error));