const path = require('path');
const gamedig = require('gamedig');
const Discord = require('discord.js');

module.exports = (host, port, callback) => {
    gamedig.query({
        type: 'csgo',
        host: host,
        port: port
    }).then(state => {
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

        callback(embed);
    }).catch(error => {
        if (error) {
            // Server if offline
            callback(undefined);
        }
    });
}