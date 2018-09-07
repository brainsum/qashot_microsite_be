'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const db = require('../../../database');

/**
 * @type {Sequelize.Model}
 */
const QueueModel = db.models.Queue;

router.post('/add', asyncHandler(async function (req, res, next) {
    const uuid = req.body.uuid;

    let item = undefined;

    try {
        item = await QueueModel.create({ uuid: uuid });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }

    return res.status(200).json({
        message: 'Ok.',
        response: item
    });

}));

/**
 * Return a list of results. Optionally, filter against a given list of UUIDs.
 */
router.post('/list', asyncHandler(async function (req, res, next) {
    const uuids = req.body.uuids;

    let queueItems = undefined;

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

        queueItems = await QueueModel.findAndCountAll(options);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({error: 'Internal error while processing the request.'});
    }

    let rowsKeyed = {};
    queueItems.rows.forEach(function (item) {
        rowsKeyed[item.uuid] = item;
    });


    return res.status(200).json({
        count: queueItems.count,
        queueItems: rowsKeyed
    });
}));

module.exports = router;