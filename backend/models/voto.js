module.exports = (sequelize, DataTypes) => {
  const Voto = sequelize.define('Voto', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    opcion_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
  }, {
    tableName: 'votos',
    timestamps: false
  });
  return Voto;
};