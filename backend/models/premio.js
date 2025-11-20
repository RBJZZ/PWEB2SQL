module.exports = (sequelize, DataTypes) => {
  const Premio = sequelize.define('Premio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_premio: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    tipo_premio: {
      type: DataTypes.ENUM('BORDE_PERFIL', 'INSIGNIA', 'TEMA_PERFIL'),
      allowNull: false
    },
    imagen_preview_url: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    costo_en_fancoins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    }
  }, {
    tableName: 'premios_virtuales',
    timestamps: false
  });
  return Premio;
};