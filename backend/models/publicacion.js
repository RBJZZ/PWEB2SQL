module.exports = (sequelize, DataTypes) => {
  const Publicacion = sequelize.define('Publicacion', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    texto_pregunta: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
        defaultValue: 'pendiente',
        allowNull: false
    }
  }, {
    tableName: 'publicaciones',
    timestamps: false
  });
  return Publicacion;
};