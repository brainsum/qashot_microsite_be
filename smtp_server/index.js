'use strict';

// @todo: Check out: https://github.com/guileen/node-sendmail
// @todo: Check out: https://github.com/haraka/Haraka

function preFlightCheck() {
    const requiredEnvVars = [
        'EXPOSED_PORT',
        'SERVER_USER',
        'SERVER_PASSWORD'
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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const HOST = '0.0.0.0';
const PORT = process.env.EXPOSED_PORT;

const SMTPServer = require('smtp-server').SMTPServer;

const options = {
    name: 'smtp_server',
    secure: false,
    logger: true,
    useXForward: true,
    // onConnect(session, callback){
    //     console.log(`Session remote: ${session.remoteAddress}`);
    //     console.log(`Session remote: ${session.clientHostname}`);
    //
    //     if(session.remoteAddress === '127.0.0.1'){
    //         return callback(new Error('No connections from localhost allowed'));
    //     }
    //     return callback(); // Accept the connection
    // },
    onAuth(auth, session, callback){
        if(auth.username !== process.env.SERVER_USER || auth.password !== process.env.SERVER_PASSWORD){
            return callback(new Error('Invalid username or password'));
        }
        callback(null, {user: 1}); // where 123 is the user id or similar property
    }
};

const server = new SMTPServer(options);

server.listen(PORT, HOST, function serverListenerCallback() {
    console.log(`SMTP Server listening on ${HOST}:${PORT}`);
});
