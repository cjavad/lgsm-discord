const fs = require('fs');
const nrc = require('node-run-cmd');
const cleanInput = require('./cleanInput');

module.exports = (user, path, command, callback) => {
    let output = '';
    var cmd = `sudo runuser -l ${user} -c \"${path} ${command}\"`;

    if (!fs.existsSync(path)) { callback('0'); return };

    nrc.run(cmd, {
        onData: data => { output = output + cleanInput(data); },
        onDone: () => { callback(output); }
    });
}