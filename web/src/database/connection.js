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

module.exports = connection;
