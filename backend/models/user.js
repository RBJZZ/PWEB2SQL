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
    password: {
        type: DataTypes.STRING,
        field: 'password_hash', 
        allowNull: false
    }
  }, {
    tableName: 'usuarios', 
    timestamps: true,
    underscored: true
  });

  return User;
};