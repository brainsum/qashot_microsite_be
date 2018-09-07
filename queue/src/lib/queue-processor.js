'use strict';

const db = require('../database');
const web = require('../client/microsite-web');
const worker = require('../client/qashot-worker');

const QueueModel = db.models.Queue;

function delay(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

const loop = async function loop() {
    let item = undefined;
    try {
        item = await QueueModel.findOne({
            where: {
                status: {
                    [db.Op.not]: 'ok'
                },
                waitUntil: {
                    [db.Op.or]: {
                        [db.Op.is]: null,
                        [db.Op.lt]: new Date()
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        await delay(3000);
        return loop();
    }

    if (item === null) {
        console.log('There are no items in the queue that should be sent.');
        await delay(3000);
        return await loop();
    }

    let test = undefined;
    try {
        test = await web.getTest(item.uuid);
    }
    catch (error) {
        console.error(error);
        await delay(3000);
        return loop();
    }

    let updatedItem = item.get({ plain: true });
    let response = undefined;
    try {
        response = await worker.addTest(test);
        updatedItem.status = 'ok';
        updatedItem.statusMessage = 'Sent to the remote worker.';
        updatedItem.sentAt = new Date();
        console.log('Test sent to the worker.');
    }
    catch (error) {
        updatedItem.status = 'error';
        updatedItem.statusMessage = error.message;
        // Wait before re-try.
        updatedItem.waitUntil = new Date(Date.now() + (1000 * 30));
    }

    let update = undefined;
    try {
        update = QueueModel.update(updatedItem, {
            where: {
                uuid: updatedItem.uuid
            }
        });
        console.log('Item updated.');
    }
    catch (error) {
        console.error(error);
    }

    await delay(1000);
    return loop();
};

module.exports = {
    loop
};
