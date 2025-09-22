"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const yargsHelpers = require("yargs/helpers");
const cmdInit = require("./cmdInit");
const cmdBuild = require("./cmdBuild");
console.log(__dirname);
async function main() {
    yargs()
        .scriptName("webpan")
        .usage('$0 <cmd> [args]')
        .command('init [path]', 'Initialise a project', async (yargs) => {
        yargs.positional('path', {
            type: 'string',
            default: '.',
            describe: 'path to initialise the project at'
        });
    }, async (argv) => {
        await cmdInit(argv);
    })
        .command('build [path]', 'Builds a project', async (yargs) => {
        yargs.positional('path', {
            type: 'string',
            default: '.',
            describe: 'path to initialise the project at'
        });
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
        .parse(yargsHelpers.hideBin(process.argv));
}
main();
//# sourceMappingURL=entry.js.map