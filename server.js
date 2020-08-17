// lgsmIO server

const fs = require('fs');
const ini = require('ini');
const runner = require('./lib/runner');
const notp = require('notp');
const crypto = require('crypto');

const config = ini.parse(fs.readFileSync('server.ini', 'utf-8'));

const server = require('http').createServer();
const io = require('socket.io')(server);

io.on('connection', socket => {
    // New connection
    let authed = false;

    const token = notp.totp.gen(config.key, 30); 
    const hashed = crypto.createHash('sha256').update(token).digest('base64');

    socket.on('auth', data => {
        if (data === hashed) {
            // Keys match
            authed = true;
            // Ready to execute lgsm commands
            socket.emit('ready');
        }
    });

    socket.on('lgsm', (user, path, command) => {
        runner(user, path, command, output => {
            socket.emit('output', output.toString());
        });
    })

    socket.on('disconnect', () => {
        // Connection Closed
    });
});

server.listen(4545);

