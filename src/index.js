const { exec } = require('child_process');
var path = require('path');
var sudo = require('sudo-prompt');
var PLATFORM = require('os').platform();

var EXECUTABLES = {
    darwin: path.join(__dirname, '..', 'bin/ExManCmd_mac/Contents/MacOS/ExManCmd'),
    win32: path.join(__dirname, '..', 'bin/ExManCmd_win/ExManCmd.exe'),
    win64: path.join(__dirname, '..', 'bin/ExManCmd_win/ExManCmd.exe'),
};

var COMMAND_PREFIXES = {
    darwin: '--',
    win32: '/',
    win64: '/',
};

var ARGUMENT_HELP = {
    install: 'the .zxp file path.',
    remove: 'the extension name.',
    disable: 'the extension name.',
    enable: 'the extension name.',
    update: 'the extension name.',
};


/**
 * Create a function that invokes the ExManCmd commands. See the docs:
 * https://helpx.adobe.com/extension-manager/using/command-line.html
 *
 * @param  {String} command     Command name
 * @return {Function}           Function to execute that command
 */
var exManCommand = function(command) {
    return function(argument, sudoOptions = { name: "Exman" }) {
        return new Promise(function(resolve, reject) {

            if (!(PLATFORM in EXECUTABLES)) {
                return reject('Your current platform is unsupported: ' + PLATFORM);
            }

            if (!argument) {
                return reject('The "' + command + '" command requires the first argument to be ' + ARGUMENT_HELP[command]);
            }

            var executable = EXECUTABLES[PLATFORM].replace('app.asar', 'app.asar.unpacked');

            var args = [COMMAND_PREFIXES[PLATFORM] + command, `"${argument}"`];

            var cmd = `"${executable}" ${args.join(" ")}`;
            var needSudo = command === "install" || command === "remove";

            var _sudo = () => {
                sudo.exec(cmd, sudoOptions, (err, stdout, stderr) => {
                        if (err) reject(err);
                        else resolve(stdout);
                    }
                );
            }

            if (process.platform === "darwin" && needSudo) _sudo();
            else {
                exec(cmd, {}, (err, stdout, stderr) => {
                        if (err) {
                            if (needSudo) _sudo();
                            else reject(err);
                        } else resolve(stdout);
                    }
                )
            }
        });
    };
};

module.exports = {
    disable: exManCommand('disable'),
    enable: exManCommand('enable'),
    install: exManCommand('install'),
    remove: exManCommand('remove'),
    update: exManCommand('update'),
};
