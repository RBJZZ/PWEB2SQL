const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { Sequelize, Op } = require('sequelize'); 
const multer = require('multer');
const session = require('express-session');

const db = require('./backend/models');

const User = db.User;
const Publicacion = db.Publicacion;
const Opcion = db.Opcion;
const Voto = db.Voto;
const Comentario = db.Comentario;

const app = express();
const port = 3000;

const logFilePath = path.join(__dirname, 'server.log');

function logEvent(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(logMessage.trim());

    // Escribe en el archivo (modo 'append' para no borrar lo anterior)
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error("Error escribiendo en log:", err);
    });
}

app.use(session({
    secret: 'tu-secreto-muy-seguro-aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

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

async function verificarLogro(usuario_id, nombreLogro) {
    try {
        const logro = await db.Premio.findOne({ where: { nombre_premio: nombreLogro } });
        if (!logro) return;

        const yaTiene = await db.Inventario.findOne({
            where: { usuario_id, premio_id: logro.id }
        });

        if (!yaTiene) {
            await db.Inventario.create({ usuario_id, premio_id: logro.id });
            console.log(`¡Logro desbloqueado para usuario ${usuario_id}: ${nombreLogro}!`);
            return true; 
        }
    } catch (error) {
        console.error("Error verificando logro:", error);
    }
    return false;
}

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
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                foto_perfil_url: user.foto_perfil_url,
                rol: user.rol 
            };
            logEvent(`Login Exitoso: Usuario ${user.email} (${user.id})`);
            res.status(200).json({
                message: `¡Bienvenido de nuevo, ${user.username}!`,
                user: req.session.user 
            });
        } else {
            logEvent(`Login Fallido: Credenciales incorrectas para ${email}`);
            res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
    } catch (error) {
        logEvent(`ERROR CRÍTICO en Login: ${error.message}`);
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'fan_coins', 'foto_perfil_url', 'foto_portada_url', 'fecha_registro'],
            include: [
                {
                    model: Publicacion,
                    include: [Opcion]
                },
                {
                    model: db.Premio,
                    through: { attributes: [] }
                }
            ],
            order: [[Publicacion, 'id', 'DESC']]
        });

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const aciertosCount = await Voto.count({
            where: { usuario_id: userId },
            include: [{
                model: Opcion,
                where: { es_correcta: true } 
            }]
        });

        const userJSON = user.toJSON();
        userJSON.total_aciertos = aciertosCount; 

        res.json(userJSON);

    } catch (error) {
        console.error(error);
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
            where: { estado: 'aprobado' }, 
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

        const user = await User.findByPk(usuario_id, { transaction: t });
        user.fan_coins += 20; // Premio por publicar
        await user.save({ transaction: t });

        await t.commit();
        if (req.session.user && req.session.user.id === user.id) {
            req.session.user.fan_coins = user.fan_coins;
        }

        const countPosts = await Publicacion.count({ where: { usuario_id } });
        if (countPosts === 1) { // Es el primero que acaba de crear
            await verificarLogro(usuario_id, 'Primer Post');
        }

        logEvent(`Nueva Publicación: Usuario ${usuario_id} creó un post.`);
        res.status(201).json({ message: 'Publicación creada. ¡Ganaste 20 FanCoins!' });

    } catch (error) {
        await t.rollback();
        console.error("Error al crear publicación con imagen:", error);
        logEvent(`ERROR creando publicación: ${error.message}`);
        res.status(500).json({ message: 'Error al crear la publicación.', error: error.message });
    }
});

app.get('/api/publicaciones/buscar', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
        return res.json([]);
    }

    try {
        const resultados = await Publicacion.findAll({
            where: {
                estado: 'aprobado',
                [Op.or]: [
                    { texto_pregunta: { [Op.like]: `%${q}%` } },
                    { '$User.nombre_usuario$': { [Op.like]: `%${q}%` } }
                ]
            },
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'username', 'foto_perfil_url'],
                    as: 'User' 
                },
                { model: Opcion } 
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al realizar la búsqueda.' });
    }
});

app.get('/api/publicaciones/trending', async (req, res) => {
    try {
        const [topPosts] = await db.sequelize.query(`
            SELECT 
                P.id,
                COUNT(V.id) as votesCount
            FROM publicaciones AS P
            JOIN opciones AS O ON P.id = O.publicacion_id
            JOIN votos AS V ON O.id = V.opcion_id
            WHERE 
                P.estado = 'aprobado' AND 
                V.created_at >= NOW() - INTERVAL 3 DAY
            GROUP BY P.id
            ORDER BY votesCount DESC
            LIMIT 5;
        `);

        if (topPosts.length === 0) {
            return res.json([]);
        }

        const topPostIds = topPosts.map(p => p.id);

        const trendingPosts = await Publicacion.findAll({
            where: {
                id: {
                    [Op.in]: topPostIds
                }
            },
            include: [{ model: User, attributes: ['username'] }]
        });

        const response = trendingPosts.map(post => {
            const postJSON = post.toJSON();
            const voteInfo = topPosts.find(p => p.id === post.id);
            postJSON.votesCount = voteInfo ? voteInfo.votesCount : 0;
            return postJSON;
        });
        
        response.sort((a, b) => b.votesCount - a.votesCount);

        res.json(response);

    } catch (error) {
        console.error("Error al obtener trending posts:", error);
        res.status(500).json({ message: 'Error al obtener las tendencias.' });
    }
});

app.get('/api/publicaciones/:id', async (req, res) => {
    try {
        const viewerId = req.query.userId;
        const publicacion = await Publicacion.findByPk(req.params.id, {
            where: {
                [Op.or]: [
                    { estado: 'aprobado' },
                ]
            },
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

        if (!publicacion || publicacion.estado !== 'aprobado') {
            return res.status(404).json({ message: 'Publicación no encontrada o pendiente de aprobación.' });
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

        const user = await User.findByPk(usuario_id);
        user.fan_coins += 5;
        await user.save();
        
        if (req.session.user && req.session.user.id === user.id) {
            req.session.user.fan_coins = user.fan_coins;
        }
        
        const comentarioCompleto = await Comentario.findByPk(nuevoComentario.id, {
            include: [{ 
                model: User, 
                attributes: ['id', 'username', 'foto_perfil_url']
            }]
        });

        const countComments = await Comentario.count({ where: { usuario_id } });
        if (countComments >= 5) { 
            await verificarLogro(usuario_id, 'Comentarista');
        }

        res.status(201).json(comentarioCompleto);
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar el comentario.', error: error.message });
    }
});

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.rol === 'admin') {
        return next(); 
    }
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
}

app.get('/api/admin/publicaciones/pendientes', isAdmin, async (req, res) => {
    try {
        const publicacionesPendientes = await Publicacion.findAll({
            where: { estado: 'pendiente' },
            include: [
                { model: User, attributes: ['username'] },
                { model: Opcion }
            ],
            order: [['id', 'ASC']]
        });
        res.json(publicacionesPendientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener publicaciones pendientes.' });
    }
});

app.put('/api/admin/publicaciones/:id/estado', isAdmin, async (req, res) => {
    const { nuevoEstado } = req.body; 

    if (!['aprobado', 'rechazado'].includes(nuevoEstado)) {
        return res.status(400).json({ message: 'El nuevo estado no es válido.' });
    }

    try {
        const publicacion = await Publicacion.findByPk(req.params.id);
        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada.' });
        }
        
        publicacion.estado = nuevoEstado;
        await publicacion.save();

        res.status(200).json({ message: `El estado de la publicación ${publicacion.id} fue actualizado a '${nuevoEstado}'.` });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado de la publicación.' });
    }
});

// ENDPOINTS DE GAMIFICACIÓN

app.get('/api/shop', async (req, res) => {
    try {
        const premios = await db.Premio.findAll({
            where: {
                costo_en_fancoins: {
                    [Op.lt]: 10000 
                }
            }
        });
        res.json(premios);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar la tienda.' });
    }
});

app.post('/api/shop/buy', async (req, res) => {
    const { usuario_id, premio_id } = req.body;
    const t = await db.sequelize.transaction();

    try {
        const user = await User.findByPk(usuario_id, { transaction: t });
        const premio = await db.Premio.findByPk(premio_id, { transaction: t });

        if (!user || !premio) {
            await t.rollback();
            return res.status(404).json({ message: 'Item no encontrado.' });
        }

        const yaTiene = await db.Inventario.findOne({
            where: { usuario_id, premio_id },
            transaction: t
        });

        if (yaTiene) {
            await t.rollback();
            return res.status(400).json({ message: '¡Ya tienes este artículo!' });
        }

        if (user.fan_coins < premio.costo_en_fancoins) {
            await t.rollback();
            return res.status(400).json({ message: 'No tienes suficientes FanCoins.' });
        }

        user.fan_coins -= premio.costo_en_fancoins;
        await user.save({ transaction: t });
        
        await db.Inventario.create({ usuario_id, premio_id }, { transaction: t });

        await t.commit();

        
        
        if (req.session.user && req.session.user.id === user.id) {
            req.session.user.fan_coins = user.fan_coins;
        }

        logEvent(`Venta Tienda: Usuario ${usuario_id} compró item ${premio_id} por ${premio.costo_en_fancoins} monedas`);
        res.json({ message: `¡Compra exitosa!`, newBalance: user.fan_coins });

    } catch (error) {
        await t.rollback();
        logEvent(`ERROR en Tienda: ${error.message}`);
        res.status(500).json({ message: 'Error en la compra.', error: error.message });
    }
});

app.post('/api/votos', async (req, res) => {
    const { usuario_id, opcion_id } = req.body;
    try {
        
        const opcion = await Opcion.findByPk(opcion_id, {
            include: [{ model: Publicacion }] 
        });

        if (!opcion) return res.status(404).json({ message: 'Opción no encontrada' });

        const newVoto = await Voto.create({ usuario_id, opcion_id });
        
        let mensaje = "Voto registrado.";
        let coinsGanadas = 0;

        if (opcion && opcion.es_correcta) {
            const user = await User.findByPk(usuario_id);
            coinsGanadas = 50; 
            user.fan_coins += coinsGanadas;
            await user.save();
            mensaje = "¡Correcto! Ganaste 50 FanCoins.";
            

            if (req.session.user && req.session.user.id === user.id) {
                req.session.user.fan_coins = user.fan_coins;
            }
        }

        const autorId = opcion.Publicacion.usuario_id;
        
        if (autorId != usuario_id) {
            const autor = await User.findByPk(autorId);
            if (autor) {
                autor.fan_coins += 2; 
                await autor.save();
            }
        }

        res.status(201).json({ 
            voto: newVoto, 
            message: mensaje,
            coinsGanadas,
            esCorrecta: opcion.es_correcta 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al votar', error: error.message });
    }
});

// ENDPOINTS DE REPORTES

app.get('/api/reports/top-users', async (req, res) => {
    try {
        const [results] = await db.sequelize.query(`
            SELECT u.nombre_usuario, u.foto_perfil_url, COUNT(v.id) as aciertos
            FROM usuarios u
            JOIN votos v ON u.id = v.usuario_id
            JOIN opciones o ON v.opcion_id = o.id
            WHERE o.es_correcta = TRUE
            GROUP BY u.id
            ORDER BY aciertos DESC
            LIMIT 5
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error reporte usuarios' });
    }
});

// 2. Publicaciones más Populares (Por número de votos)
// Cruza: Publicaciones -> Opciones -> Votos
app.get('/api/reports/top-posts-votes', async (req, res) => {
    try {
        const [results] = await db.sequelize.query(`
            SELECT p.id, p.texto_pregunta, u.nombre_usuario, COUNT(v.id) as total_votos
            FROM publicaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN opciones o ON p.id = o.publicacion_id
            LEFT JOIN votos v ON o.id = v.opcion_id
            WHERE p.estado = 'aprobado'
            GROUP BY p.id
            ORDER BY total_votos DESC
            LIMIT 5
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error reporte votos' });
    }
});

// 3. Temas más Discutidos (Por número de comentarios)
// Cruza: Publicaciones -> Comentarios
app.get('/api/reports/top-posts-comments', async (req, res) => {
    try {
        const [results] = await db.sequelize.query(`
            SELECT p.id, p.texto_pregunta, COUNT(c.id) as total_comentarios
            FROM publicaciones p
            JOIN comentarios c ON p.id = c.publicacion_id
            WHERE p.estado = 'aprobado'
            GROUP BY p.id
            ORDER BY total_comentarios DESC
            LIMIT 5
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error reporte comentarios' });
    }
});

// 4. Usuarios más "Valiosos" (Monedas + Cantidad de Items Comprados)
// Cruza: Usuarios -> Inventario
app.get('/api/reports/richest-users', async (req, res) => {
    try {
        const [results] = await db.sequelize.query(`
            SELECT u.nombre_usuario, u.fan_coins, COUNT(i.id) as items_comprados
            FROM usuarios u
            LEFT JOIN inventario_usuarios i ON u.id = i.usuario_id
            GROUP BY u.id
            ORDER BY u.fan_coins DESC
            LIMIT 5
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error reporte ricos' });
    }
});

db.sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            const msg = `Servidor API corriendo en http://localhost:${port}`;
            console.log(msg);
            logEvent('--- INICIO DEL SERVIDOR ---');
        });
    })
    .catch(error => console.error('Error al sincronizar las tablas:', error));