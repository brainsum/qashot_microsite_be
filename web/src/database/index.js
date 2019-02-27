'use strict';

// Db is configured via env, use production key just because.
const dbConfig = require('../../config/database').production;
const Sequelize = require('sequelize');
const connection = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        pool: dbConfig.pool,

        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: dbConfig.operatorsAliases
    }
);

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
const definitions = require('./definitions');

for (const name in definitions) {
    models[name] = connection.define(name, definitions[name].attributes, definitions[name].options);
}

module.exports = {
    connection,
    models
};
