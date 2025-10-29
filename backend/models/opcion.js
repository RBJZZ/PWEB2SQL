module.exports = (sequelize, DataTypes) => {
  const Opcion = sequelize.define('Opcion', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    publicacion_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    texto_opcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imagen_url: {
        type: DataTypes.STRING(512),
        allowNull: true // Permite que sea nulo para opciones de solo texto
    },
    es_correcta: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
  }, {
    tableName: 'opciones',
    timestamps: false
  });
  return Opcion;
};