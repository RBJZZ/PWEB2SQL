module.exports = (sequelize, DataTypes) => {
  const Inventario = sequelize.define('Inventario', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    premio_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'inventario_usuarios',
    timestamps: true,
    createdAt: 'fecha_adquisicion',
    updatedAt: false
  });
  return Inventario;
};