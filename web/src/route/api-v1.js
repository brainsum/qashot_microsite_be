'use strict';

const express = require('express');
const apiRouter = express.Router();
const asyncHandler = require('express-async-handler');

const validator = require('jsonschema');
const schemaLoader = require('../lib/schema-loader');
const db = require('../database');
const queue = require('../client/queue');
const mailer = require('../client/mailer');

const emailLimit = process.env.TESTS_PER_EMAIL_LIMIT || 20;
const unrestrictedDomains = loadUnrestrictedDomains();

/**
 * Loads the json schema.
 *
 * @return {Promise<*>}
 */
async function loadTestAddJsonSchema() {
    try {
        return await schemaLoader('test-add-request.json');
    }
    catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Load unrestricted domains from env.
 *
 * @return {string[]}
 */
function loadUnrestrictedDomains() {
    const domains = process.env.EMAIL_LIMIT_EXCLUDED_DOMAINS || '';

    if (domains.trim() === '') {
        return [];
    }

    const domainList = domains.trim().split(';');

    if (domainList.length === 1 && domainList[0] === '') {
        return [];
    }

    return domainList;
}

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
    return res.status(200).json({'schema': await loadTestAddJsonSchema()});
}));

apiRouter.post('/test/add', asyncHandler(async function (req, res) {
    const data = req.body;
    const validationErrors = validateJsonData(data, await loadTestAddJsonSchema());

    if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
            'message': 'Invalid data in the request.',
            'errors': validationErrors
        });
    }

    /**
     * @type {Sequelize.Model}
     */
    const Tests = db.models.Tests;
    let existingTests = 0;

    try {
        existingTests = await Tests.count({
            where: { email: data.email }
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error
        });
    }

    const emailDomain = data.email.split('@')[1];
    // @todo: Check for email aliases as well.
    if (
        existingTests >= emailLimit
        && unrestrictedDomains.indexOf(emailDomain) === -1
    ) {
        return res.status(400).json({
            message: `Test limit of ${emailLimit} reached for email ${data.email}.`
        });
    }

    let newTest = undefined;

    try {
        // The validation only allows the required fields, so this should be OK.
        newTest = await Tests.create(data);
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
    const Tests = db.models.Tests;

    let existingTest = undefined;
    try {
        existingTest = await Tests.findOne({ where: { uuid: uuid }});
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