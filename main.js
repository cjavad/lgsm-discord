const fs = require('fs');
const Discord = require('discord.js');
const micromatch = require('micromatch');
const nrc = require('node-run-cmd');
const config = require('./config');

class Parser {
    
}

const commands = [
    {
        command: 'install',
        short: 'i',
        enabled: false
    },
    {
        command: 'auto-install',
        short: 'ai',
        enabled: true,
        warn: true
    },
    {
        command: 'start',
        short: 'st',
        enabled: true
    },
    {
        command: 'stop',
        short: 'sp',
        enabled: true,
        warn: true
    },
    {
        command: 'restart',
        short: 'r',
        enabled: true,
        warn: true
    },
    {
        command: 'details',
        short: 'dt',
        enabled: true
    },
    {
        command: 'post-details',
        short: 'pd',
        enabled: true
    },
    {
        command: 'backup',
        short: 'b',
        enabled: true,
        warn: true
    },
    {
        command: 'update-lgsm',
        short: 'ul',
        enabled: true,
        warn: true
    },
    {
        command: 'monitor',
        short: 'm',
        enabled: true
    },
    {
        command: 'test-alert',
        short: 'ta',
        enabled: true
    },
    {
        command: 'update',
        short: 'u',
        enabled: true,
        warn: true
    },
    {
        command: 'force-update',
        short: 'fu',
        enabled: true,
        warn: true
    },
    {
        command: 'validate',
        short: 'v',
        enabled: true,
        warn: true
    },
    {
        command: 'console',
        short: 'c',
        enabled: false
    },
    {
        command: 'debug',
        short: 'd',
        enabled: false
    }
];

const client = new Discord.Client();

function argParse(prefix, seperator) {
    return str => {
        if (str.startsWith(prefix)) {
            str = str.substring(1);
            var args = str.split(seperator);
            var command = args[0];
            args.shift();

            return {
                command: command,
                args: args
            };
        }
    };
};

function pad(pad, str, padLeft) {
    if (typeof str === 'undefined')
        return pad;
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}


client.on('message', message => {
    if (config.access.includes(message.author.id)) {
        if (message.content.startsWith(config.prefix)) {
            var servers = config.servers;
            var args = argParse(config.prefix, ' ')(message.content);
            var command = commands.filter(x => {
                return x.command === args.command || x.short === args.command;
            });

            if (args.args.length) {
                servers = servers.filter(x => {
                    return micromatch.isMatch(x.name, args.args);
                });
            }

            if (command.length === 0) {
                // invalid argument(s)
                var helpMessage = `Usage: ${config.prefix}[command] [servers...]?\n**Valid Commands:**\n\`\`\``;
                commands.forEach(cmd => {
                    helpMessage += `${cmd.short.length <= 1 ? pad('  ', cmd.short, false) : cmd.short} ${cmd.command} \n`;
                });
                helpMessage += "```"
                message.channel.send(helpMessage);
            } else {
                servers.forEach(server => {
                    if (fs.existsSync(server.path)) {
                        message.channel.send(`Running \`${server.path} ${command[0].command}\` on **${server.user} ${server.name}**`);
                        let output = `OUTPUT OF: ${server.path} ${command[0].command}\n\n`;
    
                        nrc.run(`sudo runuser -l ${server.user} -c \"${server.path} ${command[0].short}\"`, {
                            onData: data => {
                                var data = data.split("\n");
                                data.forEach(line => {
                                    if (line) {
                                        while (/\[\d+m/.test(line)) {
                                            line = line.replace(/\[\d+m/, '').replace(/\[K/, '');
                                        }
                                        output += line + '\n';
                                    }
                                });
                            },
                            onDone: () => {
                                message.channel.send(`Finished running \`${server.path} ${command[0].short}\` on **${server.user}@${server.ip}**\n`, {
                                    files: [{
                                        attachment: Buffer.from(output),
                                        name: 'output.txt'
                                    }]
                                });
                            }
                        });
                    }
                });
            }
        }
    };
});

client.login(config.discordToken);