'use strict';

const WEB_URL = 'http://web:4000';
const GET_ENDPOINT = `${WEB_URL}/api/v1/test/get`;

const request = require('request-promise-native');

const getTest = async function getTest(uuid) {
    const reqConfig = {
        url: `${GET_ENDPOINT}`,
        json: { uuid: uuid }
    };

    return request.post(reqConfig)
        .then(function (response) {
            return Promise.resolve({
                code: 200,
                message: 'Ok.',
                test: response.test
            });
        })
        .catch(function (error) {
            console.error(`Getting the test from web failed. Error: ${error}`);
            return Promise.reject({
                code: error.code,
                message: error.message,
                error: error
            });
        });
};

module.exports = {
    getTest
};