// Initilizes with a prefix and seperator
// and returns a function that takes
// the input (discord message)
// And validates and parses command

// NEW -> Outputs ['arg1', 'arg2', ...]
// OLD -> Outputs { command: 'commandname', args: ['arg1', 'arg2', ...] }
module.exports = (prefix, seperator) => {
    return str => {
        // checks if message starts with prefix (is it a command?)
        if (typeof str === 'string' && str.startsWith(prefix)) {
            // Removes prefix by removing the lenght of the prefix
            str = str.substring(prefix.length);
            // Splits remaning message by the seperator defined
            // Typically just a white space
            var args = str.split(seperator);

            /* START OF EXCLUDED CODE
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
            END OF EXCLUDED CODE */

            // Only return args
            return args;
        }
    };
};