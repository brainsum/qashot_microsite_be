'use strict';

const express = require('express');
const paginate = require('express-paginate');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const db = require('../../../database');

/**
 * @type {Sequelize.Model}
 */
const NotificationModel = db.models.Notification;

/**
 * Return a list of notifications. Optionally, filter against a given list of UUIDs.
 */
router.post('/list', asyncHandler(async function (req, res, next) {
    const uuids = req.body.uuids;

    let notifications = undefined;

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

        notifications = await NotificationModel.findAndCountAll(options);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({error: 'Internal error while processing the request.'});
    }

    let rowsKeyed = {};
    notifications.rows.forEach(function (result) {
        rowsKeyed[result.uuid] = result;
    });


    return res.status(200).json({
        count: notifications.count,
        notifications: rowsKeyed
    });
}));

module.exports = router;