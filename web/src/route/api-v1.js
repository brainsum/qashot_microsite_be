'use strict';

const express = require('express');
const apiRouter = express.Router();
const asyncHandler = require('express-async-handler');

const validator = require('jsonschema');
const schemaLoader = require('../lib/schema-loader');
const db = require('../database');
const queue = require('../client/queue');
const mailer = require('../client/mailer');

let testAddSchema = undefined;
const emailLimit = 20;

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

    /**
     * @type {Sequelize.Model}
     */
    const Test = db.models.Test;
    let existingTests = 0;

    try {
        existingTests = await Test.count({
            where: { email: data.email }
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error
        });
    }

    if (existingTests >= emailLimit) {
        return res.status(500).json({
            message: `Test limit of ${emailLimit} reached for email ${data.email}.`
        });
    }

    let newTest = undefined;

    try {
        // The validation only allows the required fields, so this should be OK.
        newTest = await Test.create(data);
    }
    catch (error) {
        return res.status(500).json({
            message: error
        });
    }

    try {
        const message = await queue.addTest(newTest);
        console.log(message);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not add the test to the queue.'
        });
    }

    try {
        const message = await mailer.addListener(newTest);
        console.log(message);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not add listener for the test.'
        });
    }

    return res.status(201).json({
        message: 'Created.',
        test: newTest
    });
}));

apiRouter.post('/test/get', asyncHandler(async function (req, res) {
    const uuid = req.body.uuid;

    /**
     * @type {Sequelize.Model}
     */
    const Test = db.models.Test;

    let existingTest = undefined;
    try {
        existingTest = await Test.findOne({ where: { uuid: uuid }});
    }
    catch (error) {
        return res.status(500).json({
            message: error
        });
    }

    return res.status(200).json({
        test: existingTest
    });
}));

module.exports = apiRouter;