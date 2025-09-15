import yargs = require("yargs");
import findRoot = require("../info/findRoot");
import cleanBuild = require("../actions/cleanBuild");
import fsUtils = require("../utils/fsUtils");
import path = require("path");
import calcHashedEntries = require("../info/calcHashedEntries");
import hashedEntriesCache = require("../info/hashedEntriesCache");

async function cmdBuild(args: yargs.Arguments): Promise<void> {
    const argPath = args.path as string;
    const root = await findRoot(argPath);

    if(root === null) {
        console.error("Project not initialised: no project root found.");
        return;
    }

    const doClean: boolean = (args.clear ?? false) as boolean;

    if(doClean) {
        await cleanBuild(root);
    }

    const srcPath = path.join(root, "src");
    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);
    const cachedHashedEntries = await hashedEntriesCache.getHashedEntriesCache(root);
}

export = cmdBuild;
