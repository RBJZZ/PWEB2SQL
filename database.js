const { Sequelize } = require('sequelize');

// Configura la conexión a tu base de datos MySQL
const sequelize = new Sequelize('CUP26_DATABASE', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql'
});

// Probar la conexión (opcional pero recomendado)
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