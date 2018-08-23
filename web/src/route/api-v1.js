'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const apiRouter = express.Router();

apiRouter.post('/test/add', asyncHandler(async function (req, res) {
    res.send('DUMMY RESPONSE.');
}));


module.exports = apiRouter;