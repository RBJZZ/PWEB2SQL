const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('cup26_database', 'root', 'CrimsonNight16', {
    host: 'localhost',
    dialect: 'mysql'
});

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