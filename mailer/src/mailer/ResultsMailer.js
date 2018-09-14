'use strict';

const Mailer = require('../lib/mailer');

const transporter = process.env.MAILER_TRANSPORTER;

let config = undefined;
if ('mailgun' === transporter) {
    const mailgun = require('nodemailer-mailgun-transport');
    const mailgunConfig = {
        auth: {
            api_key: process.env.MAILER_MAILGUN_API_KEY,
            domain: process.env.MAILER_MAILGUN_DOMAIN
        }
    };
    config = mailgun(mailgunConfig)
}

if ('mailtrap' === transporter) {
    config = {
        pool: true,
        host: process.env.MAILER_HOST,
        port: Number(process.env.MAILER_PORT),
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASS
        }
    };
}

if ('microsite_mail_server' === transporter) {
    config = {
        pool: true,
        host: 'mail_server',
        port: 587
    };
}

if ('mailhog' === transporter) {
    config = {
        pool: true,
        host: 'mailhog',
        port: 1025
    };
}

const ResultsMailer = new Mailer('ResultsMailer', config);

module.exports = ResultsMailer;
