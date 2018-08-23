'use strict';

const express = require('express');
const apiRouter = express.Router();
const asyncHandler = require('express-async-handler');

const validator = require('jsonschema');
const schemaLoader = require('../lib/schema-loader');

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
        validationResult.errors.forEach(function (error) {
            const name = error.property.split('.')[1];
            errors[name] = `${error.instance} ${error.message}`;
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

    return res.status(200).json('The request contains valid data.');
}));

module.exports = apiRouter;