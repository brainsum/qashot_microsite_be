'use strict';

const db = require('../database');
const ResultsMailer = require('../mailer').ResultsMailer;
const resultsClient = require('../client/results');

// We are only enabling firefox for this service until chrome is working properly.
const timeout = 10000;

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

/**
 * @type {Sequelize.Model}
 */
const ResultModel = db.models.Result;
const NotificationModel = db.models.Notification;

async function storeResults(results) {
    const uuid = results.original_request.uuid;
    try {
        let update = await ResultModel.update({
            received: true,
            receivedAt: new Date(),
            rawData: results
        }, {
            where: {
                uuid: uuid
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    let storedResults = undefined;
    try {
        storedResults = await ResultModel.findOne({
            where: {
                uuid: uuid
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    if (null === storedResults) {
        return Promise.reject(`The results for uuid ${uuid} were not found.`);
    }

    return Promise.resolve(storedResults.get({ plain: true }));
}

async function getTestData(uuid) {
    // @todo: Move to web-client.
    const request = require('request');

    const requestConfig = {
        url: 'http://web:4000/api/v1/test/get',
        json: { uuid: uuid }
    };

    return new Promise((resolve, reject) => {
        request.post(requestConfig, function (err, httpResponse, body) {
            if (err) {
                console.error(`Getting the test data for ${uuid} failed. Error: ${err}`);
                return reject(err);
            }

            return resolve(body.test);
        });
    });
}

async function sendEmail(results) {
    const uuid = results.uuid;

    if (0 === Object.keys(results.rawData).length || null === results.rawData || 'undefined' === typeof results.rawData) {
        return Promise.reject(`Results for "${uuid}" are not yet ready.`);
    }

    let testData = undefined;
    try {
        testData = await getTestData(uuid);
    }
    catch (error) {
        throw error;
    }

    const testEndDate = new Date(new Date(results.rawData.metadata.duration.full.end).getTime() + 12096e5);
    const formatter = new Intl.DateTimeFormat('en', {month: 'long'});

    const templateData = {
        reference_url: testData.reference_url,
        test_url: testData.test_url,
        success: results.rawData.metadata.success,
        results_url: results.rawData.resultsUrl,
        results_removal_date: `${testEndDate.getDay()} ${formatter.format(testEndDate.getMonth())}, ${testEndDate.getFullYear()}`,
    };

    let mailerResponse = {};

    try {
        mailerResponse = await ResultsMailer.sendMail(testData.email, templateData);
    }
    catch (error) {
        mailerResponse = error;
    }

    mailerResponse.uuid = uuid;

    return storeEmail(mailerResponse);
}

async function storeEmail(result) {
    let storedNotification = undefined;
    let stored = undefined;

    const status = 200 <= result.code && result.code < 400;

    try {
        [storedNotification, stored] = await NotificationModel.findOrCreate({
            where: {
                uuid: result.uuid
            },
            defaults: {
                uuid: result.uuid,
                status: status,
                message: result.message || 'Ok.',
                sentAt: status ? new Date() : null,
                waitUntil: status ? null : new Date(Date.now() + (1000 * 30))
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    return Promise.resolve(storedNotification.get({ plain: true }), stored);
}

async function getTestResult() {
    let test = undefined;
    try {
        test = await ResultModel.findOne({
            where: {
                received: false,
                waitUntil: {
                    [db.Op.or]: {
                        [db.Op.is]: null,
                        [db.Op.lt]: new Date()
                    }
                }
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    if (null === test) {
        return Promise.reject('There are no results waiting to be fetched.');
    }

    return Promise.resolve(test.get({ plain: true }));
}

async function updateTestResult(result) {
    let update = undefined;
    try {
        update = ResultModel.update(result, {
            where: {
                uuid: result.uuid
            }
        });
        return Promise.resolve(`Results for ${result.uuid} have been updated.`);
    }
    catch (error) {
        return Promise.reject(error);
    }
}

async function fetchResult() {
    let testResult = undefined;
    try {
        testResult = await getTestResult();
    }
    catch (error) {
        return Promise.reject(error);
    }

    let response = undefined;
    try {
        response = await resultsClient.getResult(testResult.uuid);
    }
    catch (error) {
        return Promise.reject(error);
    }

    const results = response.results;
    const resultUuids = Object.keys(results);
    if (null === results || 'undefined' === typeof results || resultUuids.length === 0) {
        testResult.waitUntil = new Date(Date.now() + (1000 * 30));
        let updateResult = await updateTestResult(testResult);
        return Promise.reject(`Test results not yet ready (uuid: ${testResult.uuid}).`);
    }

    // results[resultUuids[0]].createdAt
    // results[resultUuids[0]].sentAt
    // @todo: Add results endpoint for fetching a single result, not a bunch of them.
    // @fixme: @todo: if there are more than one results [shouldn't be the case for microsite]
    //                we only get one.
    return Promise.resolve(results[resultUuids[0]].data);
}

async function fetchEmail() {
    let email = undefined;
    try {
        email = await NotificationModel.findOne({
            where: {
                status: false,
                waitUntil: {
                    [db.Op.or]: {
                        [db.Op.is]: null,
                        [db.Op.lt]: new Date()
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        return Promise.reject(error);
    }

    if (null === email) {
        return Promise.reject('There are no emails waiting to be sent to users.')
    }

    return Promise.resolve(email.get({ plain: true }));
}

async function loadResults(uuid) {
    let result = undefined;
    try {
        result = await ResultModel.findOne({
            where: {
                uuid: uuid
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    if (null === result) {
        return Promise.reject(`The are no results for uuid "${uuid}"`);
    }

    return Promise.resolve(result.get({ plain: true }));
}

async function updateEmail(result) {
    let updatedRows = undefined;
    let updatedCount = undefined;

    const status = 200 <= result.code && result.code < 400;

    try {
        [updatedCount, updatedRows] = await NotificationModel.update({
            status: status,
            message: result.message || 'Ok.',
            sentAt: status ? new Date() : null,
            waitUntil: status? null : new Date(Date.now() + (1000 * 30))
        }, {
            where: {
                uuid: result.uuid
            }
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    return Promise.resolve(`Update. Rows affected: ${updatedCount}`);
}

async function bulkCreateNotifications(uuids) {
    const rows = uuids.map(function (uuid) {
        return {
            uuid: uuid,
            status: false,
            message: 'Synced from "Results".'
        };
    });

    try {
        const bulkMessage = NotificationModel.bulkCreate(rows);
        return Promise.resolve('Results synced to Notifications, as they were missing.');
    }
    catch (error) {
        return Promise.reject(error);
    }
}

async function syncTables() {
    let missingUuids = [];
    try {
        missingUuids = await db.connection.query(
            'SELECT "uuid" FROM "Results" WHERE "uuid" NOT IN (SELECT "uuid" FROM "Notifications")', {
                type: db.connection.QueryTypes.SELECT
            }
        );
    }
    catch (error) {
        console.log(error);
    }

    if (Array.isArray(missingUuids) && missingUuids.length > 0) {
        console.log(`Syncing notifications (${missingUuids.length}).`);

        const uuids = missingUuids.map(function (row) {
            return row.uuid;
        });

        return bulkCreateNotifications(uuids);
    }

    return Promise.reject('No Result/Notification sync is required.');
}

function loop() {
    console.time('resultsProcessorLoop');
    fetchResult().then(results => {
        return storeResults(results);
    })
        .then(results => {
            return sendEmail(results);
        })
        .then(function restartResultsLoop() {
            console.timeEnd('resultsProcessorLoop');
            loop();
        })
        .catch(error => {
            console.timeEnd('resultsProcessorLoop');
            console.error(error);
            return delay(timeout).then(() => {
                loop();
            });
        });

    // @todo: Move "fetch results" into a separate service.
    // @todo: Rename "Results" and "Notification" uuid fields to "testUuid" for clarity.
    //        Reasoning: For the microsite we don't need to support re-running tests [while keeping every result].
    // In case there are emails that failed to deliver, send them again.
    fetchEmail().then(function (mail) {
        return loadResults(mail.uuid);
    })
        .then(results => {
            return sendEmail(results);
        })
        .then(result => {
            return updateEmail(result);
        })
        .catch(function (error) {
            console.log(error);
        });

    // @todo: This is pretty bad, but until I have time to refactor the service, this has to do.
    syncTables().then(response => {
        console.log(response);
    }).catch(error => {
        console.log(error);
    });
}

module.exports = {
    loop
};
