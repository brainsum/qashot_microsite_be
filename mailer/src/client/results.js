'use strict';

const RESULTS_URL = process.env.WORKER_URL;
const RESULTS_FETCH_PATH = '/api/v1/result/fetch';

const request = require('request-promise-native');

const getResult = async function getResult(uuid) {
    const payload = {
        origin: process.env.ORIGIN_ID,
        testUuids: [
            uuid
        ]
    };

    const reqOptions = {
        url: `${RESULTS_URL}${RESULTS_FETCH_PATH}`,
        json: payload
    };

    return request.post(reqOptions)
        .then(response => {
            return Promise.resolve(response);
        })
        .catch(error => {
            return Promise.reject(error);
        });
};

module.exports = {
    getResult
};
