'use strict';

const express = require('express');
const paginate = require('express-paginate');
const asyncHandler = require('express-async-handler');

const adminRouter = express.Router();
const db = require('../database');
const moment = require('moment');

adminRouter.use(paginate.middleware(50, 500));

adminRouter.get('/', asyncHandler(async function (req, res) {
    res.send('Admin access.');
}));

const request = require('request');
const url = require('url');
const querystring = require('querystring');

/**
 *
 * @param {String[]} uuids
 * @return {Promise<*>}
 */
async function getResults(uuids) {
    const requestConfig = {
        url: 'http://mailer:4001/api/v1/result/list',
        json: {
            uuids
        }
    };

    return new Promise((resolve, reject) => {
        request.post(requestConfig, function (err, httpResponse, body) {
            if (err) {
                console.error(`Getting the result list failed. Error: ${err}`);
                return reject(err);
            }

            return resolve(body.results);
        });
    });
}

/**
 *
 * @param {String[]} uuids
 * @return {Promise<*>}
 */
async function getNotifications(uuids) {
    const requestConfig = {
        url: 'http://mailer:4001/api/v1/notification/list',
        json: {
            uuids
        }
    };

    return new Promise((resolve, reject) => {
        request.post(requestConfig, function (err, httpResponse, body) {
            if (err) {
                console.error(`Getting the notification list failed. Error: ${err}`);
                return reject(err);
            }

            return resolve(body.notifications);
        });
    });
}

/**
 * Generate a path to be used in the pager.
 *
 * @param {Request} req
 *   The request.
 * @param {Number} pageNumber
 *   Page number.
 *
 * @return {string}
 *   The path for the page.
 */
function generatePagerPathForPage(req, pageNumber) {
    const lastPageUrl = url.parse(req.originalUrl);
    const currentQuery = querystring.parse(lastPageUrl.query || '');

    currentQuery.page = pageNumber;

    return `${lastPageUrl.pathname}?${querystring.stringify(currentQuery)}`;
}

adminRouter.get('/list', asyncHandler(async function (req, res, next) {
    const Tests = db.models.Tests;

    let testResults = undefined;

    try {
        testResults = await Tests.findAndCountAll({
            limit: req.query.limit,
            offset: req.skip,
            order: [
                [
                    'id',
                    'DESC',
                ]
            ],
        });
    }
    catch (error) {
        return res.status(500).send(error);
    }

    const testCount = testResults.count;
    const pageCount = Math.ceil(testCount / req.query.limit);

    let tests = testResults.rows;

    // Get test uuids.
    let uuids = [];
    tests.forEach(function (test) {
        uuids.push(test.uuid);
    });

    // Get results for uuids.
    let results = {};
    try {
        results = await getResults(uuids);
    }
    catch (error) {
        console.error(error);
    }

    let notifications = {};
    try {
        notifications = await getNotifications(uuids);
    }
    catch (error) {
        console.error(error);
    }

    // Merge tests with external data.
    tests.forEach(function (test, index) {
        tests[index] = test.get({ plain: true });
        tests[index].createdAtFormatted = ('undefined' === typeof test.createdAt)
            ? test.createdAt
            : moment(test.createdAt).format('YYYY-MM-DD hh:mm:ss Z');

        if ('undefined' !== typeof results && results.hasOwnProperty(test.uuid) && 'undefined' !== results[test.uuid]) {
            tests[index].results_url = results[test.uuid].rawData.resultsUrl;
            tests[index].resultsReceivedAt = results[test.uuid].receivedAt;
            tests[index].resultsReceivedAtFormatted = ('undefined' === typeof results[test.uuid].receivedAt)
                ? results[test.uuid].receivedAt
                : moment(results[test.uuid].receivedAt).format('YYYY-MM-DD hh:mm:ss Z');
        }
        if ('undefined' !== typeof notifications && notifications.hasOwnProperty(test.uuid) && 'undefined' !== notifications[test.uuid]) {
            tests[index].emailSentAt = notifications[test.uuid].sentAt;
            tests[index].emailSentAtFormatted = ('undefined' === typeof notifications[test.uuid].sentAt)
                ? notifications[test.uuid].sentAt
                : moment(notifications[test.uuid].sentAt).format('YYYY-MM-DD hh:mm:ss Z');
            tests[index].emailSentStatus = notifications[test.uuid].status;
        }
    });

    return res.render('admin/list', {
        tests: tests,
        pageCount,
        testCount,
        firstPageUrl: generatePagerPathForPage(req, 1),
        lastPageUrl: generatePagerPathForPage(req, pageCount),
        pages: paginate.getArrayPages(req)(5, pageCount, req.query.page)
    });
}));

module.exports = adminRouter;
