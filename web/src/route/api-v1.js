'use strict';

const express = require('express');
const apiRouter = express.Router();
const asyncHandler = require('express-async-handler');

const validator = require('jsonschema');
const schemaLoader = require('../lib/schema-loader');
const db = require('../database');
const worker = require('../lib/qashot-worker');

let testAddSchema = undefined;

schemaLoader('test-add-request.json').then(schema => {
    testAddSchema = schema;
})
    .catch(error => {
        console.log(error);
    });

/**
 *
 * @param {Object} data
 * @param {Object} schema
 */
function validateJsonData(data, schema) {
    let errors = {};

    const validationResult = validator.validate(data, schema);
    if (!validationResult.valid) {
        // @todo: In case of additionalProperty violation, name is undefined.
        validationResult.errors.forEach(function (error) {
            const name = error.property.split('.')[1];
            errors[name] = `${String(data[name])} ${error.message}`;
        });
    }
    return errors;
}

apiRouter.get('/test/add', asyncHandler(async function (req, res) {
    return res.status(200).json({'schema': testAddSchema});
}));

apiRouter.post('/test/add', asyncHandler(async function (req, res) {
    const data = req.body;
    const validationErrors = validateJsonData(data, testAddSchema);

    if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
            'message': 'Invalid data in the request.',
            'errors': validationErrors
        });
    }

    let test = undefined;
    let isNew = false;

    try {
        /**
         * @type {Sequelize.Model}
         */
        const Test = db.models.Test;
        [test, isNew] = await Test.findOrCreate({
            where: { email: data.email },
            // The validation only allows the required fields, so this should be OK.
            defaults: data
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error
        });
    }

    if (!isNew) {
        return res.status(400).json({
            message: 'Existing email address.'
        });
    }

    // @todo: On remote failure? Another service that only reads+posts? Or what?
    const message = worker.addTest(test);
    console.log(message);

    return res.status(200).json({
        message: 'Created.',
        test: test
    });
}));

module.exports = apiRouter;