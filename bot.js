const fs = require('fs');
const ini = require('ini');
const Discord = require('discord.js');

const client = new Discord.Client();
const config = ini.parse(fs.readFileSync('config.ini', 'utf-8'));
const servers = ini.parse(fs.readFileSync('servers.ini', 'utf-8'));
const commands = require('./commands');

const argParse = require('./lib/argParse')(config.discord.prefix, ' ');
const gamedig = require('./lib/gamedig');
const helpMessage = require('./lib/helpMessage');
const isReachable = require('./lib/isReachable');
const runner = require('./lib/runner');
const { run } = require('node-run-cmd');
const { start } = require('repl');


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
 * @property {string} user - Lgsm user
 * @property {string} host 
 * @property {number} port
 * @property {string} path - Lgsm executable full path
 * 
 * @param {Server} server
 * @param {Discord.Message} message
 */
function handleCommand(command, server, message) {
    if (command.notLgsm) {
        if (command.command === 'servers') {
            for (const server in servers) {
                if (!['user', 'host'].includes(server) && typeof servers[server] === 'object') {
                    servers['host'] && !servers[server].host ? servers[server].host = servers['host'] : '';
                    isReachable(servers[server].host, servers[server].port).then(online => {
                        var status = online ? '✔ Online' : '❌ Offline';
                        message.channel.send(`**${server}** hosted at **${servers[server].host}:${servers[server].port}**: ${status}`);
                    });
                }
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
                startMessage.delete();
            });
        }

        runner(server.user, server.path, command.command, output => {
            if (command.output === undefined && command.output !== false) {
                message.channel.send(`Finished running \`${server.path} ${command.command}\` on **${server.name}**\n`, {
                    files: [{
                        attachment: Buffer.from(output),
                        name: `output-lgsm-${server.host}:${server.port}-${command.command}-${new Date().toISOString().slice(0, 10)}.txt`
                    }]
                });
            }

            message.channel.send('Completed ' + command.message);
        });
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
                if (Object.keys(servers).includes(arg) && typeof servers[arg] === 'object') {
                    server = servers[arg]
                    servers['host'] && !server['host'] ? server['host'] = servers['host'] : '';
                    servers['user'] && !server['user'] ? server['user'] = servers['user'] : '';
                } else if (commands.find(command => command.command === arg || command.alias.includes(arg))) {
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