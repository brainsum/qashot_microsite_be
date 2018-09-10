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

    let storedResults = undefined;
    try {
        storedResults = await ResultModel.create({
            uuid: uuid,
            received: true,
            receivedAt: new Date(),
            rawData: results
        });
    }
    catch (error) {
        return Promise.reject(error);
    }

    return Promise.resolve(storedResults.get({ plain: true }), true);
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
        // @todo: get results url from results.
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

async function getTest() {
    let test = undefined;
    try {
        test = await ResultModel.findOne({
            where: {
                received: false
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

async function fetchResult() {
    let test = undefined;
    try {
        test = await getTest();
    }
    catch (error) {
        return Promise.reject(error);
    }

    let response = undefined;
    try {
        response = await resultsClient.getResult(test.uuid);
    }
    catch (error) {
        return Promise.reject(error);
    }

    const result = response.results;

    if (null === result || 'undefined' === typeof result || Object.keys(result).length === 0) {
        return Promise.reject(`Test results not yet ready (uuid: ${test.uuid}).`);
    }

    return Promise.resolve(result);
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
