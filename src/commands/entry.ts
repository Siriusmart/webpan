import yargs = require("yargs");
import yargsHelpers = require('yargs/helpers');
import cmdInit = require("./cmdInit");
import cmdBuild = require("./cmdBuild");

async function main(): Promise<void> {
    yargs()
    .scriptName("webpan")
    .usage('$0 <cmd> [args]')
    .command('init [path]', 'Initialise a project', async (yargs) => {
        yargs.positional('path', {
            type: 'string',
            default: '.',
            describe: 'path to initialise the project at'
        })
    }, async (argv) => {
        await cmdInit(argv);
    })
    .command('build [path]', 'Builds a project', async (yargs) => {
        yargs.positional('path', {
            type: 'string',
            default: '.',
            describe: 'path to initialise the project at'
        })
        yargs.options({
            clear: {
                alias: 'c',
                description: "Delete artifacts and rebuild all files",
                requiresArg: false,
                required: false
            }
        });
    }, async (argv) => {
        await cmdBuild(argv);
    })
    .help()
    .parse(yargsHelpers.hideBin(process.argv))
}

main();
