'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const adminRouter = express.Router();

adminRouter.get('/', asyncHandler(async function (req, res) {
    res.send('Admin access.');
}));

adminRouter.get('/list', asyncHandler(async function (req, res) {
    res.send('LIST');
}));

module.exports = adminRouter;