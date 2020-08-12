const fs = require('fs');
const Discord = require('discord.js');
const gamedig = require('gamedig');
const ip2loc = require("ip2location-nodejs");
const nrc = require('node-run-cmd');
const config = require('./config');

const commands = [
    {
        command: 'help',
        short: 'h',
        notLgsm: true
    },
    {
        command: 'status',
        short: 's',
        notLgsm: true
    },
    
    {
        command: 'auto-install',
        short: 'ai',
        warn: true
    },
    {
        command: 'start',
        short: 'st'
    },
    {
        command: 'stop',
        short: 'sp',
        warn: true
    },
    {
        command: 'restart',
        short: 'r',
        warn: true
    },
    {
        command: 'details',
        short: 'dt',
        
    },
    {
        command: 'post-details',
        short: 'pd',
        
    },
    {
        command: 'backup',
        short: 'b',
        warn: true
    },
    {
        command: 'update-lgsm',
        short: 'ul',
        warn: true
    },
    {
        command: 'monitor',
        short: 'm',
        
    },
    {
        command: 'test-alert',
        short: 'ta',
        
    },
    {
        command: 'update',
        short: 'u',
        warn: true
    },
    {
        command: 'force-update',
        short: 'fu',
        warn: true
    },
    {
        command: 'validate',
        short: 'v',
        warn: true
    }
];

const client = new Discord.Client();

// Initilizes with a prefix and seperator
// and returns a function that takes
// the input (discord message)
// And validates and parses command
// Outputs { command: 'commandname', args: ['arg1', 'arg2', ...] }
function argParse(prefix, seperator) {
    return str => {
        // checks if message starts with prefix (is it a command?)
        if (typeof str === 'string' && str.startsWith(prefix)) {
            // Removes prefix by removing the lenght of the prefix
            str = str.substring(prefix.length);
            // Splits remaning message by the seperator defined
            // Typically just a white space
            var args = str.split(seperator);
            // The first arg will always be the command name
            // So i'll move that into a seperate variable
            var command = args[0];
            // And remove the first argument (the command name)
            args.shift();
            
            // The function returns the object containing
            // the command name and a list of arguments
            return {
                command: command,
                args: args
            };
        }
    };
};

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

function splitConnectionString (ipString) {
    ipString = ipString.split(":");
    return {
        host: ipString[0],
        port: isNaN(ipString[1]) ? undefined : Number(ipString[1])
    }
}

function extractUserFromPath(lgsmRunFilePath) {
    lgsmRunFilePath = lgsmRunFilePath.split('/').filter(elm => elm.length);
    return lgsmRunFilePath[1];
}

function cleanInput(line) {
    if (line) {
        while (/\[\d+m/.test(line)) {
            line = line.replace(/\[\d+m/, '').replace(/\[K/, '');
        }
        return line;
    }
}

function lsgm(lgsmPath, lgsmCommand, callback) {
    let output = '';
    var user = extractUserFromPath(lgsmPath);
    var cmd = `sudo runuser -l ${user} -c \"${lgsmPath} ${lgsmCommand}\"`;

    if (!fs.existsSync(lgsmPath)) { callback(undefined); return };

    nrc.run(cmd, {
        onData: data => { output = output + cleanInput(data); },
        onDone: () => { callback(output); }
    });
}

function helpMessage() {
    var helpMessage = `Usage: ${config.prefix}[server] [command]?\n**Valid Commands:**\n\`\`\``;
    commands.forEach(cmd => {
        helpMessage += `${cmd.short.length <= 1 ? pad('  ', cmd.short, false) : cmd.short} ${cmd.command} \n`;
    });
    helpMessage += "```"
    return helpMessage;
    
}

client.on('message', message => {
    // Validate & split discord message into command (name) and arguments
    var command = argParse(config.prefix, ' ')(message.content);
    if (command && ['h', 'help'].indexOf(command.command) > -1) {
        // Always print usage even if help is not called.
        return message.channel.send(helpMessage());
    // VERY BIG BRAIN MOVE.
    } else if (command && config.servers.filter(x => x.name === command.command)) {
        var server = config.servers.filter(x => x.name === command.command)[0];
        if (!server) return;
        if (!command.args.length) return;
        var commandName = command.args[0];
        var commandObject = commands.filter(c => commandName === c.short || commandName === c.command);
        if (!commandObject.length) return;
        var commandObject = commandObject[0];

        if (commandObject.notLgsm && commandObject.short === 's') {
            // Output server status by ip.
            gamedig.query({
                type: 'csgo',
                ...splitConnectionString(server.pubIp)
            }).then(state => {
                ip2loc.IP2Location_init('./data/IP-COUNTRY-SAMPLE.BIN');
                var loc = 'US'; // ip2loc.IP2Location_get_country_short(state.connect);

                var embed = new Discord.MessageEmbed({
                    title: state.name,
                    description: `Ping: ${state.ping || null}`,
                    fields: [
                        {
                            name: 'Status',
                            value: ':green_circle: Online',
                            inline: true
                        },
                        {
                            name: 'Address:Port',
                            value: state.connect,
                            inline: true
                        },
                        {
                            name: 'Location',
                            value: `:flag_${loc.toLowerCase()}: ${loc}`,
                            inline: true
                        },
                        {
                            name: 'Game',
                            value: state.raw.game,
                            inline: true
                        },
                        {
                            name: 'Current Map',
                            value: state.map,
                            inline: true
                        }, {
                            name: 'Players',
                            value: `${state.players.length}/${state.maxplayers}`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'lgsm-discord by apple#0018'
                    }
                });
                return message.channel.send(embed);
            }).catch(error => {
                if (error) {
                    // Server if offline
                    return message.channel.send("Failed to connect to " + server.pubIp);
                }
            });
        
        } else {
            // LGSM COMMAND
            lsgm(server.path, commandObject.command, output => {
                message.channel.send(`Finished running \`${server.path} ${commandObject.short}\` on **${server.name}**\n`, {
                    files: [{
                        attachment: Buffer.from(output),
                        name: 'output.txt'
                    }]
                });
            });
        }
    }
});

// Login to discord using the configured discord token
client.login(config.discordToken);