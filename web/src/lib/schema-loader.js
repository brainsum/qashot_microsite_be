'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

const basePath = path.normalize(path.join(__dirname, '..', 'json-schema'));

/**
 * Load a schema file from the base dir.
 *
 * @param {String} schemaFile
 * @return {Promise<any>}
 */
module.exports = async function (schemaFile) {
    const schemaPath = path.join(basePath, schemaFile);

    let fileData = undefined;

    try {
        fileData = await readFile(schemaPath, 'utf8');
    }
    catch (error) {
        console.error(`Error while loading the ${schemaFile} schema.`);
        console.error(error);
        throw error;
    }

    if (undefined === typeof fileData) {
        throw new Error(`The ${schemaFile} schema was not loaded.`);
    }

    return JSON.parse(fileData);
};
