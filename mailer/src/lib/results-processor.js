'use strict';

const db = require('../database');
const ResultsQueue = require('../message-queue').ResultsQueue;
const ResultsMailer = require('../mailer').ResultsMailer;

// We are only enabling firefox for this service until chrome is working properly.
const currentChannel = ResultsQueue.channelConfigs.firefox;
const timeout = 10000;

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

async function storeResults(results) {
    const uuid = results.metadata.uuid;

    let storedResults = undefined;
    try {
        /**
         * @type {Sequelize.Model}
         */
        const Result = db.models.Result;
        storedResults = await Result.create({
            uuid: uuid,
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

    // @todo: Remove this.
    if (process.env.NODE_ENV === 'development') {
        // On dev, for testing, add dummy data.
        return Promise.resolve({
            reference_url: 'http://www.google.com',
            test_url: 'http://www.google.hu',
            email: `user+${uuid}@example.com`
        });
    }

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

function loop() {
    console.time('resultsProcessorLoop');
    ResultsQueue.read(currentChannel.name).then(results => {
    // ResultsQueueReadDummy(currentChannel.name).then(results => {
        return storeResults(results);
    })
        .then(results => {
            return sendEmail(results);
        })
        .then(result => {
            return storeEmail(result);
        })
        // .then(function () {
        //     console.log('waiting a bit, dummy request');
        //     return delay(timeout + 50000);
        // })
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

async function ResultsQueueReadDummy(channelName) {
    const uuid = require('uuid/v4');

    const currentUuid = uuid();

    return Promise.resolve({
        "metadata": {
            "id": "9",
            "uuid": currentUuid,
            "mode": "a_b",
            "stage": null,
            "browser": "firefox",
            "engine": "slimerjs",
            "viewportCount": 2,
            "scenarioCount": 1,
            "duration": {
                "full": {
                    "start": "2018-08-24T14:25:27.263Z",
                    "end": "2018-08-24T14:25:53.126Z",
                    "duration": 25.863,
                    "metric_type": "seconds"
                },
                "reference": {
                    "start": "2018-08-24T14:25:27.272Z",
                    "end": "2018-08-24T14:25:40.306Z",
                    "duration": 13.034,
                    "metric_type": "seconds"
                },
                "test": {
                    "start": "2018-08-24T14:25:40.307Z",
                    "end": "2018-08-24T14:25:53.122Z",
                    "duration": 12.815,
                    "metric_type": "seconds"
                }
            },
            "testCount": 2,
            "passedCount": 0,
            "failedCount": 2,
            "passRate": 0,
            "success": false
        },
        "results": [
            {
                "scenarioLabel": "405bc5b5-6fd3-4b8f-9196-f22331bf3c90",
                "viewportLabel": "Full HD",
                "success": false,
                "reference": "../reference/9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_0_Full_HD.png",
                "test": "../test/20180824-142541/9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_0_Full_HD.png",
                "diffImage": "../test/20180824-142541/failed_diff_9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_0_Full_HD.png",
                "misMatchPercentage": "6.88"
            },
            {
                "scenarioLabel": "405bc5b5-6fd3-4b8f-9196-f22331bf3c90",
                "viewportLabel": "Mobile",
                "success": false,
                "reference": "../reference/9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_1_Mobile.png",
                "test": "../test/20180824-142541/9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_1_Mobile.png",
                "diffImage": "../test/20180824-142541/failed_diff_9_405bc5b5-6fd3-4b8f-9196-f22331bf3c90_0_document_1_Mobile.png",
                "misMatchPercentage": "6.88"
            }
        ],
        "resultsUrl": "http://www.brainsum.com"
    });
}
