"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const yargsHelpers = require("yargs/helpers");
const cmdBuild = require("./cmdBuild");
async function main() {
    await new Promise(res => setTimeout(res, 100));
    yargs()
        .scriptName("webpan")
        .usage('$0 <cmd> [args]')
        .command('build [path]', 'Builds a project', async (yargs) => {
        yargs.positional('path', {
            type: 'string',
            default: '.',
            describe: 'path to initialise the project at'
        });
        yargs.options({
            tabspaces: {
                alias: 't',
                description: "Tab width",
                default: undefined,
                required: false,
                type: "count"
            }
        });
        yargs.options({
            formatbuildinfo: {
                description: "Format buildInfo.json",
                default: undefined,
                required: false,
                type: "boolean"
            }
        });
        yargs.options({
            clean: {
                alias: 'c',
                description: "Delete artifacts and rebuild all files",
                default: undefined,
                required: false,
                type: "boolean"
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