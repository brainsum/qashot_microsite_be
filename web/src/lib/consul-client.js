'use strict';

function fromCallback(fn) {
    return new Promise(function(resolve, reject) {
        try {
            return fn(function(err, data, res) {
                if (err) {
                    err.res = res;
                    return reject(err);
                }
                return resolve([data, res]);
            });
        } catch (err) {
            return reject(err);
        }
    });
}

const { inspect } = require('util');
const consulOptions = {
    host: 'consul',
    port: 8500,
    promisify: fromCallback()
};

const consul = require('consul')(consulOptions);

/**
 * @type {string}
 */
const KEYS_BASE_PATH = 'qashot/microsite/web';


module.exports = async function () {
    let keys = [];
    try {
        keys = await consul.kv.keys(KEYS_BASE_PATH);
        console.log(inspect(keys));
    }
    catch (error) {
        console.log(`Consul keys error: ${error}`);
        throw error;
    }

    let values = {};

    keys.forEach(async function(key) {
        values[key] = await consul.kv.get(`${KEYS_BASE_PATH}/${key}`);
    });

    return values;
};
