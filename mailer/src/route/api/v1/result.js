'use strict';

const express = require('express');
const paginate = require('express-paginate');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const db = require('../../../database');

/**
 * @type {Sequelize.Model}
 */
const ResultModel = db.models.Result;

/**
 * Return a list of results. Optionally, filter against a given list of UUIDs.
 */
router.post('/list', asyncHandler(async function (req, res, next) {
    const uuids = req.body.uuids;

    let results = undefined;

    try {
        let options = {
            where: {
                uuid: {
                    [db.Op.in]: uuids
                }
            }
        };

        if ('undefined' === typeof uuids || (uuids.constructor === Array && uuids.length === 0)) {
            options = {};
        }

        results = await ResultModel.findAndCountAll(options);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({error: 'Internal error while processing the request.'});
    }

    let rowsKeyed = {};
    results.rows.forEach(function (result) {
        rowsKeyed[result.uuid] = result;
    });


    return res.status(200).json({
        count: results.count,
        results: rowsKeyed
    });
}));

module.exports = router;