module.exports = {
    discordToken: '',
    prefix: '$',
    user: 'csgoserver',
    access: [
        'DiscordId',
    ],
    servers: [{
            path: '/home/csgoserver/csgoserver',
            pubIp: '255.255.255.255:27015',
            name: 'server 1'
        },
        {
            path: '/home/csgoserver-2/csgoserver',
            pubIp: '255.255.255.255:27025',
            name: 'server 2'
        },
        {
            path: '/home/csgoserver-3/csgoserver',
            pubIp: '255.255.255.255:27035',
            name: 'server 3'
        },
        {
            path: '/home/csgoserver-4/csgoserver',
            pubIp: '255.255.255.255:27045',
            name: 'server 4'
        }
    ]
}