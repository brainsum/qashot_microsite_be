'use strict';

const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const resultsMailTemplate = pug.compileFile(path.join(__dirname, '..', 'view', 'mail', 'results-notification.pug'));

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

module.exports = class Mailer {

    constructor(id, transporterConfig) {
        this.mailerId = id;

        console.log(`Mailer ${this.mailerId} has been created.`);
        this.transporter = nodemailer.createTransport(transporterConfig);

        // this.transporter.verify();
    }

    async sendMail(recipient, data) {
        const mailOptions = {
            from: 'no-reply@qashot.com',
            to: recipient,
            subject: `QAShot.com visual comparison results - ${data.success === true ? 'PASSED' : 'FAILED'}`,
            html: resultsMailTemplate({data: data})
        };

        try {
            const response = await this.transporter.sendMail(mailOptions);
            console.log(`${this.mailerId}:: Email sent: ${response.response}`);
            return Promise.resolve({
                code: 200,
                message: 'Email sent.'
            });
        }
        catch (error) {
            console.log(`${this.mailerId}:: ${error}`);
            return Promise.reject({
                code: 400,
                message: error.message
            });
        }
    }

};
