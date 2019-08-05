'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const connection = new Sequelize('mailer_db', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: 'mailer_db',
    dialect: 'postgres',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

async function checkConnection() {
    try {
        await connection.authenticate();
        console.log('PGSQL:: Connection has been established successfully.')
    }
    catch (error) {
        console.error('PGSQL:: Unable to connect to the database:', error);
        throw new Error(error.message);
    }
}

checkConnection();

const models = {};
// @todo: Fix "Result" and "Notification", then re-enable this.
const definitions = require('./definitions');

for (const name in definitions) {
    models[name] = connection.define(name, definitions[name].attributes, definitions[name].options);
}

module.exports = {
    connection,
    models,
    Op
};
