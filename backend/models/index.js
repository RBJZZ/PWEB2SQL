const { Sequelize } = require('sequelize');
const sequelize = require('../database'); // La instancia de conexión

const db = {};

// PASO 1: Cargar TODOS los modelos. Es crucial que el nuevo modelo esté aquí.
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Publicacion = require('./publicacion')(sequelize, Sequelize.DataTypes);
db.Opcion = require('./opcion')(sequelize, Sequelize.DataTypes);
db.Voto = require('./voto')(sequelize, Sequelize.DataTypes);
db.Comentario = require('./comentario')(sequelize, Sequelize.DataTypes); // <-- ¡LA LÍNEA CLAVE QUE FALTABA O ESTABA MAL UBICADA!

// PASO 2: Crear TODAS las asociaciones.
// Ahora que db.Comentario existe, estas líneas funcionarán correctamente.

db.User.hasMany(db.Publicacion, { foreignKey: 'usuario_id' });
db.Publicacion.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Publicacion.hasMany(db.Opcion, { foreignKey: 'publicacion_id' });
db.Opcion.belongsTo(db.Publicacion, { foreignKey: 'publicacion_id' });

db.User.hasMany(db.Voto, { foreignKey: 'usuario_id' });
db.Voto.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Opcion.hasMany(db.Voto, { foreignKey: 'opcion_id' });
db.Voto.belongsTo(db.Opcion, { foreignKey: 'opcion_id' });

// --- Asociaciones nuevas ---
db.Publicacion.hasMany(db.Comentario, { foreignKey: 'publicacion_id' });
db.Comentario.belongsTo(db.Publicacion, { foreignKey: 'publicacion_id' });

db.User.hasMany(db.Comentario, { foreignKey: 'usuario_id' });
db.Comentario.belongsTo(db.User, { foreignKey: 'usuario_id' });

// PASO 3: Exportar
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;