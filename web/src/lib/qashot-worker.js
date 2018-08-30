'use strict';

const WORKER_URL = process.env.WORKER_URL;
const ADD_ENDPOINT = `${WORKER_URL}/api/v1/test/add`;

const request = require('request');

function sendToWorker(payload) {
    const reqConfig = {
        url: `${ADD_ENDPOINT}`,
        json: payload
    };

    request.post(reqConfig, function (err, httpResponse, body) {
        if (err) {
            console.error(`Sending the test to the worker failed. Error: ${err}`);
        }

        const { inspect } = require('util');
        console.log('httpResponse:');
        console.log(inspect(httpResponse));
        console.log('body:');
        console.log(inspect(body));
    })
}

function generateBackstopConfig(test) {
    let backstopConfig = {};
    backstopConfig.id = test.id;
    backstopConfig.viewports = [
        {
            name: 'Full HD',
            width: 1920,
            height: 907
        },
        {
            name: 'Mobile',
            width: 750,
            height: 1334
        }
    ];
    backstopConfig.scenarios = [
        {
            label: 'QAShot visual comparison',
            referenceUrl: test.reference_url,
            url: test.url,
            "readyEvent": null,
            "delay": 5000,
            "misMatchThreshold": 0,
            "selectors": [
                "document"
            ],
            "removeSelectors": [],
            "hideSelectors": [],
            "onBeforeScript": "onBefore.js",
            "onReadyScript": "onReady.js"
        }
    ];
    backstopConfig.resembleOutputOptions = {
        "errorColor": {
            "red": 255,
            "green": 255,
            "blue": 255
        },
        "errorType": "movement",
        "transparency": 0.3,
        "largeImageThreshold": 1200,
        "useCrossOrigin": true
    };

    return backstopConfig;
}

async function addTest(test) {
    const payload = {
        browser: 'firefox',
        mode: 'a_b',
        stage: '',
        uuid: test.uuid,
        origin: 'microsite',
        environment: process.env.PROJECT_ENVIRONMENT,
        test_config: generateBackstopConfig(test)
    };

    sendToWorker(payload);
}

module.exports = {
    addTest
};
