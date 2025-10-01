import type yargs = require("yargs");
import findRoot = require("../info/findRoot");
import buildInfo = require("../info/buildInfo");
import cleanBuild = require("../actions/cleanBuild");
import fsUtils = require("../utils/fsUtils");
import ProcessorHandles = require("../types/processorHandles");
import path = require("path");
import fs = require("fs/promises");
import calcHashedEntries = require("../info/calcHashedEntries");
import hashedEntriesCache = require("../info/hashedEntriesCache");
import calcDiff = require("../utils/calcDiff");
import buildDiff = require("../actions/buildDiff");
import WriteEntriesManager = require("../info/writeEntriesManager");
import wrules = require("../info/wrules");

async function cmdBuild(args: yargs.Arguments): Promise<void> {
    const argPath = args.path as string;
    const root = await findRoot(argPath);

    if(root === null) {
        console.error("Project not initialised: no project root found.");
        return;
    }

    const doClean: boolean = (args.clean ?? false) as boolean;

    if(doClean) {
        await cleanBuild(root);
    }

    let writeEntries = new WriteEntriesManager();

    const gotBuildInfo = await buildInfo.readBuildInfo(root)
    const unwrappedBuildInfo = buildInfo.unwrapBuildInfo(writeEntries, gotBuildInfo)

    ProcessorHandles.setCache(unwrappedBuildInfo.cachedProcessors)
    hashedEntriesCache.setHashedEntriesCache(unwrappedBuildInfo.hashedEntries)

    const srcPath = path.join(root, "src");

    if(!await fsUtils.exists(srcPath)) {
        await fs.mkdir(srcPath, { recursive: true });
    }

    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);

    // this does not specify whether the changed item is a file or a directory
    // this info is contained in srcContents
    // a changed item must be a file, and exists in srcContents
    const hashedDiff = calcDiff.calcDiff(unwrappedBuildInfo.hashedEntries, hashedEntries);

    wrules.setCachedRules(unwrappedBuildInfo.cachedRules)
    // wrules.initRules(srcContents)

    await buildDiff(root, writeEntries, srcContents, hashedDiff, hashedEntries);
}

export = cmdBuild;
