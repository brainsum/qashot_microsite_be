'use strict';

const express = require('express');
const asyncHandlerMiddleware = require('express-async-handler');

const apiRouter = express.Router();

apiRouter.post('/add/test', asyncHandlerMiddleware(async function (req, res) {
    res.send('DUMMY RESPONSE.');
}));


module.exports = apiRouter;