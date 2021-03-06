'use strict';

function preFlightCheck() {
    const requiredEnvVars = [
        'WORKER_URL',
        'JWT_SECRET_KEY',
        'EXPOSED_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'MAILER_HOST',
        'MAILER_PORT',
        'MAILER_USER',
        'MAILER_PASS',
        'PROJECT_ENVIRONMENT',
        'ORIGIN_ID'
    ];

    let success = true;
    requiredEnvVars.forEach(function (variableName) {
        if (!process.env.hasOwnProperty(variableName)) {
            console.error(`The required "${variableName}" environment variable is not set.`);
            success = false;
        }
    });

    if (false === success) {
        throw new Error('Pre-flight check failed.');
    }
}

preFlightCheck();

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

// Core.
const path = require('path');
// Contrib.
const express = require('express');
const helmet = require('helmet');
const { createTerminus } = require('@godaddy/terminus');
const robots = require('express-robots-txt');
// Custom.
const db = require('./src/database');
const resultsProcessor = require('./src/lib/results-processor');

// App
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src', 'view'));
app.use(robots(path.join(__dirname, 'public', 'robots.txt')));
app.use(helmet());
app.use(express.json({
    strict: true
}));

app.use('/', require('./src/route'));

let server = undefined;

function beforeShutdown () {
    // given your readiness probes run every 5 second
    // may be worth using a bigger number so you won't
    // run into any race conditions
    return new Promise(resolve => {
        setTimeout(resolve, 5000)
    })
}

function onSignal () {
    console.log('server is starting cleanup');
    return Promise.all([
        server.close()
    ]);
}

function onShutdown () {
    console.log('cleanup finished, server is shutting down');
}

function livenessCheck() {
    console.log('Probing for liveness..');
    return Promise.resolve()
}

function readinessCheck () {
    console.log('Probing for readiness..');
    const serverReadiness = new Promise((resolve, reject) => {
        if ('undefined' === typeof server || null === server.address()) {
            return reject('The server is down.');
        }

        return resolve('The server is alive.');
    });

    return Promise.all([
        serverReadiness
    ]);
}

const signals = [
    'SIGHUP',
    'SIGINT',
    'SIGUSR2',
];

const terminusOptions = {
    // Healtcheck options.
    healthChecks: {
        '/health/liveness': livenessCheck,    // Function indicating if the service is running or not.
        '/health/readiness': readinessCheck,    // Function indicating if the service can accept requests or not.
    },

    // cleanup options
    timeout: 1000,                   // [optional = 1000] number of milliseconds before forcefull exiting
    // signal,                          // [optional = 'SIGTERM'] what signal to listen for relative to shutdown
    signals,                          // [optional = []] array of signals to listen for relative to shutdown
    beforeShutdown,                  // [optional] called before the HTTP server starts its shutdown
    onSignal,                        // [optional] cleanup function, returning a promise (used to be onSigterm)
    onShutdown,                      // [optional] called right before exiting

    // both
    // logger                           // [optional] logger function to be called with errors
};

async function run() {
    try {
        const sync = await db.connection.sync();
    }
    catch (error) {
        const timeout = 3000;

        console.error(`Error while running sync(). Retry in ${timeout / 1000} seconds..`);
        await delay(timeout);
        return await run();
    }

    const PORT = Number(process.env.EXPOSED_PORT);
    const HOST = '0.0.0.0';
    console.log('Setting the server..');
    server = app.listen(PORT, HOST, function () {
        console.log(`Running on http://${HOST}:${PORT}`);
        createTerminus(server, terminusOptions);
    });

    resultsProcessor.loop();

    return Promise.resolve('Running.');
}

run();
