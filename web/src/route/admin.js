'use strict';

const express = require('express');
const paginate = require('express-paginate');
const asyncHandler = require('express-async-handler');

const adminRouter = express.Router();
const db = require('../database');

adminRouter.use(paginate.middleware(25, 50));

adminRouter.get('/', asyncHandler(async function (req, res) {
    res.send('Admin access.');
}));

adminRouter.get('/list', asyncHandler(async function (req, res, next) {
    const Test = db.models.Test;

    let results = undefined;

    try {
        results = await Test.findAndCountAll({limit: req.query.limit, offset: req.skip});
    }
    catch (error) {
        return res.status(500).send(error);
    }

    const testCount = results.count;
    const pageCount = Math.ceil(testCount / req.query.limit);

    return res.render('admin/list', {
        tests: results.rows,
        pageCount,
        testCount,
        pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
    });
}));

module.exports = adminRouter;