"use strict";

const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'web_db',
    host: 'web_db',
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
};

module.exports = {
    production: config,
    development: config,
};
