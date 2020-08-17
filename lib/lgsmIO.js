const io = require('socket.io-client');
const notp = require('notp');
const crypto = require('crypto');
const { nextTick } = require('process');

/**
 * 
 * @param {import('../bot').Server} server 
 * @param {import('../bot').Command} command
 * @param {function} callback
 */
module.exports = (server, command, callback) => {
    const socket = io('http://' + server.host + ':' + server.sPort);
    const token = notp.totp.gen(server.key, 30); // hotp(server.key, Number(data), { digits: 16 });
    const hashed = crypto.createHash('sha256').update(token).digest('base64');
    socket.emit('auth', hashed);

    socket.on('ready', data => {
        socket.emit('lgsm', server.user, server.path, command.command);
    });

    socket.on('output', output => {
        callback(output);
        socket.close();
    });
}