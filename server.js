const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { Sequelize, Op } = require('sequelize'); 
const multer = require('multer');

const db = require('./backend/models');

const User = db.User;
const Publicacion = db.Publicacion;
const Opcion = db.Opcion;
const Voto = db.Voto;
const Comentario = db.Comentario;

const app = express();
const port = 3000;


app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'backend/uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('¡Solo se permiten archivos de imagen!'), false);
        }
    }
});

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password_hash: hashedPassword
        });
        res.status(201).json({ message: `¡Registro exitoso, ${newUser.username}! Ahora puedes iniciar sesión.` });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El nombre de usuario o el email ya existen.' });
        }
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
});

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
                message: `¡Bienvenido de nuevo, ${user.username}!`,
                user: {
                    id: user.id,
                    username: user.username,
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

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'fan_coins', 'foto_perfil_url', 'foto_portada_url', 'fecha_registro'],
            include: [{
                model: Publicacion,
                include: [Opcion]
            }],
            order: [[Publicacion, 'id', 'DESC']]
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
});

app.put('/api/users/:id', 
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]), 
    async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const { username } = req.body;
        if (username) user.username = username;

        if (req.files && req.files.avatar) {
            const avatarFile = req.files.avatar[0];
            const avatarUrl = `/uploads/${avatarFile.filename}`;
            user.foto_perfil_url = avatarUrl;
        }

        if (req.files && req.files.cover) {
            const coverFile = req.files.cover[0];
            const coverUrl = `/uploads/${coverFile.filename}`;
            user.foto_portada_url = coverUrl;
        }

        await user.save();

        res.status(200).json({
            message: 'Perfil actualizado exitosamente.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                foto_perfil_url: user.foto_perfil_url,
                foto_portada_url: user.foto_portada_url 
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al actualizar el perfil.', error: error.message });
    }
});


app.get('/api/publicaciones', async (req, res) => {
    try {
        const publicaciones = await Publicacion.findAll({
            include: [
                { model: User, attributes: ['id', 'username', 'foto_perfil_url'] }, 
                { model: Opcion } 
            ],
            order: [['id', 'DESC']] 
        });
        res.status(200).json(publicaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al obtener publicaciones.', error: error.message });
    }
});

app.post('/api/publicaciones', upload.array('option_images', 4), async (req, res) => {
    const { usuario_id, texto_pregunta, opciones: opcionesJSON } = req.body;
    const opciones = JSON.parse(opcionesJSON);

    if (!usuario_id || !texto_pregunta || !opciones || opciones.length < 2) {
        return res.status(400).json({ message: 'Datos incompletos para crear la publicación.' });
    }

    const t = await db.sequelize.transaction(); 

    try {
        const nuevaPublicacion = await Publicacion.create({
            usuario_id,
            texto_pregunta
        }, { transaction: t });

        const opcionesACrear = opciones.map((opcion, index) => {
            let imageUrl = null;
            if (req.files && req.files[index]) {
                imageUrl = `/uploads/${req.files[index].filename}`;
            }

            return {
                publicacion_id: nuevaPublicacion.id,
                texto_opcion: opcion.texto,
                imagen_url: imageUrl, 
                es_correcta: opcion.es_correcta || false
            };
        });

        await Opcion.bulkCreate(opcionesACrear, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Publicación creada exitosamente.' });

    } catch (error) {
        await t.rollback();
        console.error("Error al crear publicación con imagen:", error);
        res.status(500).json({ message: 'Error al crear la publicación.', error: error.message });
    }
});

app.get('/api/publicaciones/:id', async (req, res) => {
    try {
        const viewerId = req.query.userId;
        const publicacion = await Publicacion.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'username', 'foto_perfil_url'] },
                { model: Opcion }, 
                {
                    model: Comentario,
                    include: [{ model: User, attributes: ['id', 'username', 'foto_perfil_url'] }],
                    order: [['fecha_creacion', 'ASC']]
                }
            ],
        });

        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacionJSON = publicacion.toJSON();

        let currentUserHasVoted = false;
        if (viewerId) {
            const optionIds = publicacionJSON.Opcions.map(op => op.id);
            
            const vote = await Voto.findOne({
                where: {
                    usuario_id: viewerId,
                    opcion_id: {
                        [Op.in]: optionIds 
                    }
                }
            });
            if (vote) {
                currentUserHasVoted = true;
            }
        }

        publicacionJSON.currentUserHasVoted = currentUserHasVoted;

        for (let i = 0; i < publicacionJSON.Opcions.length; i++) {
            const opcion = publicacionJSON.Opcions[i];
            const voteCount = await Voto.count({ where: { opcion_id: opcion.id } });
            opcion.votosCount = voteCount;
        }

        res.json(publicacionJSON);
    } catch (error) {
        console.error("ERROR AL OBTENER PUBLICACIÓN INDIVIDUAL:", error); 
        res.status(500).json({ message: 'Error en el servidor al obtener la publicación', error: error.message });
    }
});


app.post('/api/votos', async (req, res) => {
    const { usuario_id, opcion_id } = req.body;
    try {
        const newVoto = await Voto.create({ usuario_id, opcion_id });
        res.status(201).json(newVoto);
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el voto', error: error.message });
    }
});

app.post('/api/comentarios', async (req, res) => {
    const { usuario_id, publicacion_id, texto_comentario } = req.body;
    if (!usuario_id || !publicacion_id || !texto_comentario) {
        return res.status(400).json({ message: 'Faltan datos para crear el comentario.' });
    }
    try {
        const nuevoComentario = await Comentario.create({ usuario_id, publicacion_id, texto_comentario });
        
        const comentarioCompleto = await Comentario.findByPk(nuevoComentario.id, {
            include: [{ 
                model: User, 
                attributes: ['id', 'username', 'foto_perfil_url']
            }]
        });

        res.status(201).json(comentarioCompleto);
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar el comentario.', error: error.message });
    }
});

db.sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`Servidor API corriendo en http://localhost:${port}`);
        });
    })
    .catch(error => console.error('Error al sincronizar las tablas:', error));