'use strict';

const QUEUE_URL = 'http://queue:4002'; // process.env.WORKER_URL;
const ADD_ENDPOINT = `${QUEUE_URL}/api/v1/queue/add`;

const request = require('request-promise-native');

/**
 *
 * @param payload
 * @return {Promise<Object>}
 */
async function addToQueue(payload) {
    const reqConfig = {
        url: `${ADD_ENDPOINT}`,
        json: payload
    };

    return request.post(reqConfig)
        .then(function (response) {
            return Promise.resolve({
                code: 200,
                message: response.message,
                response: response.response
            });
        })
        .catch(function (error) {
            console.error(`Adding the test to the queue failed. Error: ${error}`);
            return Promise.reject({
                code: error.code,
                message: error.message,
                error: error
            });
        });
}

/**
 *
 * @param test
 * @return {Promise<Object>}
 */
async function addTest(test) {
    const payload = {
        uuid: test.uuid,
    };

    return await addToQueue(payload);
}

module.exports = {
    addTest
};
