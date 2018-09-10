'use strict';

const MAILER_URL = 'http://mailer:4001';
const MAILER_ADD_LISTENER_PATH = `/api/v1/result/add-listener`;

const request = require('request-promise-native');

const addListener = async function addListener(payload) {
    const reqConfig = {
        url: `${MAILER_URL}${MAILER_ADD_LISTENER_PATH}`,
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
            console.error(`Adding test result listener in the mailer service failed. Error: ${error}`);
            return Promise.reject({
                code: error.code,
                message: error.message,
                error: error
            });
        });
};

module.exports = {
    addListener
};
