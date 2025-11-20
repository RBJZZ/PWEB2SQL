// 1. IMPORTANTE: Esto debe ir en la primera línea
require('dotenv').config(); 

const { Sequelize } = require('sequelize');

// 2. Sustituimos los textos fijos por las variables
const sequelize = new Sequelize(
    process.env.DB_NAME,  // Base de datos
    process.env.DB_USER,  // Usuario
    process.env.DB_PASS,  // Contraseña
    {
        host: process.env.DB_HOST, // Host (localhost)
        dialect: 'mysql'           // Dialecto (puedes dejarlo fijo o usar variable)
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida exitosamente con Sequelize.');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
}

testConnection();

module.exports = sequelize;