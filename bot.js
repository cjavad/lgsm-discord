const fs = require('fs');
const ini = require('ini');
const Discord = require('discord.js');

const client = new Discord.Client();
const config = ini.parse(fs.readFileSync('config.ini', 'utf-8'));
const servers = ini.parse(fs.readFileSync('servers.ini', 'utf-8'));
const commands = require('./commands');
const gameservers = [];

// Convert servers config into an array of individual servers

for (const server in servers) {
    for (const gameserver in servers[server]) {
        if (typeof servers[server][gameserver] === 'object') {
            gameservers.push({
                name: gameserver,
                sName: server,
                type: servers[server].type,
                user: servers[server][gameserver].user || servers[server].user,
                host: servers[server][gameserver].host || servers[server].host,
                port: servers[server][gameserver].port,
                path: servers[server][gameserver].path,
                key: servers[server].type === 'external' ? servers[server].key : undefined,
                sPort: servers[server].type === 'external' ? servers[server].sPort : undefined
            });
        }
    }
}

const argParse = require('./lib/argParse')(config.discord.prefix, ' ');
const gamedig = require('./lib/gamedig');
const helpMessage = require('./lib/helpMessage');
const isReachable = require('./lib/isReachable');
const lgsmIO = require('./lib/lgsmIO');
const runner = require('./lib/runner');

/**
 * Handle incomming discord commands
 * 
 * @typedef Command
 * @type {object}
 * @property {string} command - Actual name of command
 * @property {Array} alias - List of alternative names
 * @property {string} message - Warning/Info message for user
 * @property {boolean} notLgsm - if the command is not a lgsm one
 * @property {boolean} output - If we should output logs
 * 
 * @param {Command} command
 * 
 * @typedef Server
 * @type {object}
 * @property {string} name - Unique server name
 * @property {string} sName - Machine name
 * @property {string} type - external or local
 * @property {string} user - Lgsm user
 * @property {string} host 
 * @property {number} port
 * @property {string} path - Lgsm executable full path
 * @property {string} key - Key for lgsmIO server
 * @property {number} sPort Port for lgsmIO server
 * 
 * @param {Server} server
 * @param {Discord.Message} message
 */
function handleCommand(command, server, message) {
    if (command.notLgsm) {
        if (command.command === 'servers') {
            for (const server of gameservers) {
                isReachable(server.host, server.port).then(online => {
                    var status = online ? '✔ Online' : '❌ Offline';
                    message.channel.send(`**${server.name}** hosted at **${server.host}:${server.port}**: ${status}`);
                });
            }
        } else if (command.command === 'status') {
            if (!server) return;
            gamedig(server.host, server.port, embed => {
                if (embed) {
                    message.channel.send(embed);
                } else {
                    message.channel.send('Error trying to get server status, server might be offline.');
                }
            });

        } else if (command.command === 'help') {
            message.channel.send(helpMessage(config.discord.prefix, commands));
        } else {
            if (command.message) {
                message.channel.send(command.message);
            }
        }
    } else {
        let startMessage;

        if (!server) {
            message.channel.send('No server specified');
            return;
        }

        if (command.message) {
            message.channel.send(command.message).then(s => {
                startMessage = s;
            });
        }

        function callback(output) {
            if (command.output === undefined && command.output !== false) {
                message.channel.send(`Finished running \`${server.path} ${command.command}\` on **${server.name}**\n`, {
                    files: [{
                        attachment: Buffer.from(output),
                        name: `output-lgsm-${server.host}:${server.port}-${command.command}-${new Date().toISOString().slice(0, 10)}.txt`
                    }]
                });
            }

            if (command.message) {
                startMessage ? startMessage.delete() : '';
                message.channel.send('Completed ' + command.message);
            }
        }

        if (server.type === 'external') {
            lgsmIO(server, command, callback);
        } else {
            runner(server.user, server.path, command.command, callback);
        }
    }
}

// Listen for commands
client.on('message', message => {
    // Check permissions
    for (let i = 0; i < config.discord.access.length; i++) {
        const id = config.discord.access[i];
        
        if (message.author.id === id || (message.member && message.member.roles.cache.some(role => role.id === id))) {
            // Parse (or try to at least) the incomming message.
            const args = argParse(message.content);
            // Check if the command is valid
            if (!args) return;
            
            let command, server;

            // Browse arguments for command name and server name
            args.forEach(arg => {
                if (gameservers.some(server => server.name === arg)) {
                    server = gameservers.find(server => server.name === arg)
                } else if (commands.some(command => command.command === arg || command.alias.includes(arg))) {
                    command = commands.find(command => command.command === arg || command.alias.includes(arg));
                }
            });

            // Pass variables to handler if command is present
            if (command) {
                return handleCommand(command, server, message);
            } else {
                // Invalid command send help message
                message.channel.send(helpMessage(config.discord.prefix, commands));
            }
            break;
        }
    }
});

client.on('ready', () => {
    console.log('lgsm-discord: connected');
});

client.login(config.discord.token);