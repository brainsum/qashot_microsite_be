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

    try {
        let mailData = await ResultsMailer.sendMail(testData.email, templateData);
        mailData.uuid = uuid;
        return Promise.resolve(mailData);
    }
    catch (error) {
        let errorData = error;
        errorData.uuid = uuid;
        return Promise.reject(errorData);
    }
}

async function storeEmail(result) {
    let storedNotification = undefined;
    try {
        const NotificationModel = db.models.Notification;
        storedNotification = await NotificationModel.create({
            uuid: result.uuid,
            status: 200 <= result.code && result.code < 400,
            message: result.message
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    return Promise.resolve(storedNotification.get({ plain: true }), true);
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
        return Promise.reject('There are no result emails waiting to be sent to users.');
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

function loop() {
    console.time('resultsProcessorLoop');
    fetchResult().then(results => {
        return storeResults(results);
    })
        .then(results => {
            return sendEmail(results);
        })
        .then(result => {
            return storeEmail(result);
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
}

module.exports = {
    loop
};
