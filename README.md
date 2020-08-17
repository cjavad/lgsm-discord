# lgsm-discord

Discord bot to deploy on linux gsm csgo servers for remote management. [https://linuxgsm.com/](https://linuxgsm.com/)

## Installation

There is a few different ways to setup lgsm-discord but they all amount in the same result in the end.

1. Seperated discord host
2. Discord hosted on one machine managing multiple servers.
3. Seperate discord bot hosted on each machine.

There are pros and cons for each of the above method so choosing what suits yourself is probably for the best.

### Deploying a socket.io lgsm-discord server

With this model you have a seperate host machine for your discord bot so it's not hosted on your game server, this can be for many reasons such as security or performance.

To manage remote machines with the discord bot code, you need to deploy a lgsm-discord server instance on each of your game servers, which are basically lightweight socket.io servers can can authenticate your discord bot and run some lgsm commands. Using TOTP (Timed One Time Passwords) we can ensure a high level of security given your unique token is kept safe.

    git clone https://github.com/cjavad/lgsm-discord.git
    cd lgsm-discord
    cp server.sample.ini server.ini

Once you have cloned into the repo edit server.ini so it contains the correct `port` you want the socket.io lgsm server to listen to, and the servers unique otp token which can be any string of text.

    nano server.ini

Once you have done this simply setup a cronjob or a systemd job to automatically start the lgsm server so you don't have to worry about keeping it up.

You can also start the server manually by doing such:

    npm run server
    # Or
    node server.js

### Deploying the bot

To deploy the bot you can choose to either redeploy it on each game server with a new configuration this might prove an issue with certain global commands such as help and servers, so those have to be disabled on your secondary bot hosts. 

Another option would be to host the discord bot either seperately or only on one game server then use the lgsm-discord socket.io server to manage those.

We can start by simply cloning this repo into your desired directory.

    git clone https://github.com/cjavad/lgsm-discord.git
    cd lgsm-discord

Then we need to configure the .ini files.

    cp config.sample.ini config.ini
    cp servers.sample.ini servers.ini

The config.ini is pretty straightforward and you can use it to even customize permissions further by reconfiguring it across each server by ei. giving certain roles access to a certain prefix on one host, but not allowing them access to the North American bot.

```ini
; Discord bot configuation
[discord]
token = ThisIsNotADiscordBotTokenButLetsGoWithIt
prefix = $
; Array of discord users and roles allowed to use ALL commands
access[] = 000000000000000000
access[] = 000000000000000000
```

The other thing you have to configure is the servers.ini file, which is quite vital for managing your servers.

The basic structure looks something like this, if you're hosting the discord bot on each game server host then you have to only specify the local servers hosted currently on each deploy.

```ini
[host1] ; Local host
type = local ; Run lgsm commands on THIS machine
host = 255.555.555.555 ; Publically exposed ip address

[host1.gameserver1] ; gameserver1 becomes the UNIQUE name of the server
port = 27015 ; Game server port
user = csgoserver ; User with access to the LGSM executable
path = /home/csgoserver/csgoserver ; LGSM executable path

[host1.gameserver2] ; gameserver2 becomes the UNIQUE name of the server
port = 27025 ; Game server port
user = csgoserver-2 ; User with access to the LGSM executable
path = /home/csgoserver-2/csgoserver ; LGSM executable path
```

Next if you need to setup external game servers you need to configure the external game server type.

```ini
[host2] ; External host
type = external
key = OneTimePasswordToken
sPort = 4545 ; Port defined in the hosts server.ini config
host = 255.555.555.555 ; Publically exposed ip address

[host2.gameserver3] ; gameserver3 becomes the UNIQUE name of the server, it can't be gameserver1 or gameserver2 as those are already defined.
user = csgoserver
port = 27015
path = /home/csgoserver/csgoserver
```

You can mix and match with each setup to see what suits you best.

## Custom Commands & Aliases

All bot commands are defined in `commmands.js` a javascript file containing a single list of command objects defined in `bot.js`.

You will find the basic structure to be something like

```js
[
    {
        command: 'commandname',
        alias: [
            'cn',
            'name'
        ],
        notLgsm: true,
        output: false,
        message: 'doing something'
    }
    ...
]
```

With this you can specify command aliases simply by editting the alias array.

Further more removing an entry effectivly removes the command.

### Deploying multiple discord bots on seperate hosts.

If you do decide to deploy multiple discord bots with the same prefix and discord bot token instead of setting up the socket.io servers you simply have to remove a few entries in the commmands.js file which further more also can be used to customize the bot.

Simply remove all the `notLgsm: true` commands from the commands.js files on every discord bot except the on you want to use those commmands.

## Usage (Example)

Kinda outdated still can be used for reference.

![From discord](https://i.imgur.com/9cXId8a.png)