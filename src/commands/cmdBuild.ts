import yargs = require("yargs");
import findRoot = require("../info/findRoot");
import cleanBuild = require("../actions/cleanBuild");
import fsUtils = require("../utils/fsUtils");
import path = require("path");
import fs = require("fs/promises");
import calcHashedEntries = require("../info/calcHashedEntries");
import hashedEntriesCache = require("../info/hashedEntriesCache");
import calcDiff = require("../utils/calcDiff");

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

    if(!await fsUtils.exists(srcPath)) {
        await fs.mkdir(srcPath, { recursive: true });
    }

    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);
    const cachedHashedEntries = await hashedEntriesCache.getHashedEntriesCache(root);

    // this does not specify whether the changed item is a file or a directory
    // this info is contained in srcContents
    // a changed item must be a file, and exists in srcContents
    const hashedDiff = calcDiff.calcDiffByExtractor(cachedHashedEntries, hashedEntries, entry => entry.hash);
}

export = cmdBuild;
