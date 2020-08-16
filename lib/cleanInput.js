module.exports = line => {
    if (line) {
        while (/\[\d+m/.test(line) || /\[K/.test(line)) {
            line = line.replace(/\[\d+m/, '').replace(/\[K/, '');
        }
        return line;
    }
}