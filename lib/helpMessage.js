// Functions that pads a string
// meaning it forces a string to 
// have a certain lenght. Example:
// 'hello' need length 10
// pads with '=' require us to add '===='
// becomes 'hello====' with a right pad
// or '====hello' with a left pad
function pad(pad, str, padLeft) {
    // if the string to pad is undefined
    // we simply return that string
    if (typeof str === 'undefined')
        return pad;
    // WORKS!!!
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}

/**
 * 
 * @param {string} prefix 
 * @param {import("../bot").Command} commands 
 */
module.exports = (prefix, commands) => {
    let notLgsmHelp = `**Command usage ${prefix}[command]**\n`;
    let lgsmHelp = `\nLGSM Usage: ${prefix}[server] [command] or ${prefix}[command] [server]\n**Valid Commands:**\n`;

    for (const command of commands) {
        if (command.notLgsm) {
            notLgsmHelp += `\`${command.command}\` \n`;
        } else {
            lgsmHelp += `\`${command.command}\` \n`;;
        }
    }

    return notLgsmHelp + lgsmHelp;    
}