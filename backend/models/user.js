module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        field: 'nombre_usuario',
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('usuario', 'admin'),
        defaultValue: 'usuario',
        allowNull: false
    },
    fan_coins: {
        type: DataTypes.INTEGER,
        defaultValue: 5000,
        allowNull: false
    },
    foto_perfil_url: {
        type: DataTypes.STRING(512),
    },
    foto_portada_url: {
        type: DataTypes.STRING(512),
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'fecha_registro',
    updatedAt: false
  });

  return User;
};