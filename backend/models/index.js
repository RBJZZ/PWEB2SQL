const { Sequelize } = require('sequelize');
const sequelize = require('../database'); // La instancia de conexión

const db = {};

// Cargar modelos
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Publicacion = require('./publicacion')(sequelize, Sequelize.DataTypes);
db.Opcion = require('./opcion')(sequelize, Sequelize.DataTypes);
db.Voto = require('./voto')(sequelize, Sequelize.DataTypes);

// Crear asociaciones
db.User.hasMany(db.Publicacion, { foreignKey: 'usuario_id' });
db.Publicacion.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Publicacion.hasMany(db.Opcion, { foreignKey: 'publicacion_id' });
db.Opcion.belongsTo(db.Publicacion, { foreignKey: 'publicacion_id' });

db.User.hasMany(db.Voto, { foreignKey: 'usuario_id' });
db.Voto.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Opcion.hasMany(db.Voto, { foreignKey: 'opcion_id' });
db.Voto.belongsTo(db.Opcion, { foreignKey: 'opcion_id' });

db.sequelize = sequelize; // Exportar la instancia
db.Sequelize = Sequelize; // Exportar la librería

module.exports = db;