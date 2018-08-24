'use strict';

const Mailer = require('../lib/mailer');

const config = {
    pool: true,
    host: process.env.MAILER_HOST,
    port: Number(process.env.MAILER_PORT),
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS
    }
};

const ResultsMailer = new Mailer('ResultsMailer', config);

module.exports = ResultsMailer;
