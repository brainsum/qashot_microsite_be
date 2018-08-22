'use strict';

const express = require('express');
const asyncHandlerMiddleware = require('express-async-handler');

const adminRouter = express.Router();

adminRouter.get('/', asyncHandlerMiddleware(async function (req, res) {
    res.send('Admin access.');
}));

adminRouter.get('/list', asyncHandlerMiddleware(async function (req, res) {
    res.send('LIST');
}));

module.exports = adminRouter;