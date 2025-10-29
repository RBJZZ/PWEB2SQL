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
    // CAMBIO CLAVE: La propiedad del modelo ahora se llama igual que la columna de la BD.
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
        // Ya no necesitamos 'field' porque el nombre coincide.
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'fecha_registro',
    updatedAt: false
  });

  return User;
};