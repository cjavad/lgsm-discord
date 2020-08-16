const ipr = require('is-port-reachable');

module.exports = (host, port) => {
    return ipr(port, { host: host });
}