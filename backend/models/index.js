const { Sequelize } = require('sequelize');
const sequelize = require('../database'); 

const db = {};

db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Publicacion = require('./publicacion')(sequelize, Sequelize.DataTypes);
db.Opcion = require('./opcion')(sequelize, Sequelize.DataTypes);
db.Voto = require('./voto')(sequelize, Sequelize.DataTypes);
db.Comentario = require('./comentario')(sequelize, Sequelize.DataTypes); 

db.Premio = require('./premio')(sequelize, Sequelize.DataTypes);
db.Inventario = require('./inventario')(sequelize, Sequelize.DataTypes);

db.User.hasMany(db.Publicacion, { foreignKey: 'usuario_id' });
db.Publicacion.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Publicacion.hasMany(db.Opcion, { foreignKey: 'publicacion_id' });
db.Opcion.belongsTo(db.Publicacion, { foreignKey: 'publicacion_id' });

db.User.hasMany(db.Voto, { foreignKey: 'usuario_id' });
db.Voto.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.Opcion.hasMany(db.Voto, { foreignKey: 'opcion_id' });
db.Voto.belongsTo(db.Opcion, { foreignKey: 'opcion_id' });

db.Publicacion.hasMany(db.Comentario, { foreignKey: 'publicacion_id' });
db.Comentario.belongsTo(db.Publicacion, { foreignKey: 'publicacion_id' });

db.User.hasMany(db.Comentario, { foreignKey: 'usuario_id' });
db.Comentario.belongsTo(db.User, { foreignKey: 'usuario_id' });

db.User.belongsToMany(db.Premio, { through: db.Inventario, foreignKey: 'usuario_id' });
db.Premio.belongsToMany(db.User, { through: db.Inventario, foreignKey: 'premio_id' });

db.User.hasMany(db.Inventario, { foreignKey: 'usuario_id' });
db.Inventario.belongsTo(db.User, { foreignKey: 'usuario_id' });
db.Inventario.belongsTo(db.Premio, { foreignKey: 'premio_id' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;