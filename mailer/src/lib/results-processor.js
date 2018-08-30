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

    const testData = await getTestData(uuid);
    const testEndDate = new Date(new Date(results.metadata.duration.full.end).getTime() + 12096e5);
    const formatter = new Intl.DateTimeFormat('en', {month: 'long'});

    const templateData = {
        reference_url: testData.reference_url,
        test_url: testData.test_url,
        success: results.metadata.success,
        // @todo: get results url from results.
        results_url: '',
        results_removal_date: `${testEndDate.getDay()} ${formatter.format(testEndDate.getMonth())}, ${testEndDate.getFullYear()}`,
    };
    return ResultsMailer.sendMail(testData.email, templateData);
}

async function storeEmail(result) {
    // @todo: Add Notifications DB table.
    // @todo: Store email results in DB.
    return Promise.resolve('stored');
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
    return Promise.resolve({
        "metadata": {
            "id": "9",
            // @todo: This is just a test, uuid-s are not yet sent back, sadly.
            "uuid": "0e35c836-032e-43fc-8868-d6be0efc2264",
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
        ]
    });
}
