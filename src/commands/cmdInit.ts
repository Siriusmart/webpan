import type yargs = require("yargs");
import findRoot = require("../info/findRoot");
import path = require("path");
import fs = require("fs/promises");

async function cmdInit(args: yargs.Arguments): Promise<void> {
    const argPath = args.path as string;
    const root = await findRoot(argPath);

    if(root !== null) {
        console.error(`Project not initialised: found existing project root at ${root}`);
    } else {
        const examplePath = path.join(__dirname, "../../example");
        await fs.cp(examplePath, argPath, { recursive: true });
        console.info("Project initialised");
    }
}

export = cmdInit;
