module.exports = (sequelize, DataTypes) => {
  const Comentario = sequelize.define('Comentario', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    publicacion_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    texto_comentario: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'comentarios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false
  });
  return Comentario;
};