'use strict';

const db = require('../database');
const ResultsQueue = require('../message-queue').ResultsQueue;
const ResultsMailer = require('../mailer').ResultsMailer;

// We are only enabling firefox for this service until chrome is working properly.
const currentChannel = ResultsQueue.channelConfigs.firefox;
const timeout = 10000;

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

async function storeResults(results) {
    // @todo: Add Results DB table.
    // @todo: Store results in the DB.
    return Promise.resolve({data: 'yes'}, true);
}

async function sendEmail(results) {
    // @todo: Read the actual recipient.
    return ResultsMailer.sendMail('mhavelant+qasmstest@brainsum.com', {reference_url: "http://www.google.com", test_url: "http://www.google.com"})
}

async function storeEmail(result) {
    return Promise.resolve('stored');
}

async function ResultsQueueReadDummy(channelName) {
    return Promise.resolve({});
}


function loop() {
    console.time('resultsProcessorLoop');
    ResultsQueue.read(currentChannel.name).then(results => {
        return storeResults(results);
    })
        .then(results => {
            return sendEmail(results);
        })
        .then(result => {
            // @todo: Add Notifications DB table.
            // @todo: Store email results in DB.
            return storeEmail(result);
        })
        .then(function restartResultsLoop() {
            console.timeEnd('resultsProcessorLoop');
            loop();
        })
        .catch(error => {
            console.timeEnd('resultsProcessorLoop');
            console.error(error);
            return delay(timeout).then(() => {
                loop();
            });
        });
}

module.exports = {
    loop
};

/*

// // MAiler testing.
//
// const ResultsMailer = require('./src/mailer').ResultsMailer;
// console.log('Mailer ID: ' + ResultsMailer.mailerId);
// const sent = ResultsMailer.sendMail('mhavelant+qasmstest@brainsum.com', {reference_url: "http://www.google.com", test_url: "http://www.google.com"});
// sent.then(msg => {
//     console.log(`Mail response! ${msg}`);
// })
//     .catch(error => {
//         console.log(error);
//     });
 */

/*
// @todo: Add "origin" to the exchanges.
let exposedChannelConfigs = {};
exposedChannelConfigs['firefox'] = {
    'name': 'firefox',
    'queue': `backstop-firefox`,
    'exchange': 'backstop-worker',
    'routing': `firefox-results`
};
 */