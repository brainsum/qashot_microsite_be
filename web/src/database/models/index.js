'use strict';

const connection = require('../connection');
const Sequelize = require('sequelize');

// Return the defined model(s).
module.exports.Tests = require('./tests')(connection, Sequelize);
