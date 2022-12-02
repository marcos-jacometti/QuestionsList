const Sequelize = require('sequelize');

const connection = new Sequelize('taskList', 'root', 'Jacometti0802$', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    timezone: '-03:00'
});

module.exports = connection;