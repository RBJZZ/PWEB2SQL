const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
    // El modelo define los atributos/columnas de la tabla
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // El nombre de usuario debe ser único
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // El email debe ser único
        validate: {
            isEmail: true // Valida que el formato sea de email
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Otras opciones del modelo
    tableName: 'users',
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

module.exports = User;