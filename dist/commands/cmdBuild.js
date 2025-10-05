"use strict";
const findRoot = require("../info/findRoot");
const buildInfo = require("../info/buildInfo");
const cleanBuild = require("../actions/cleanBuild");
const fsUtils = require("../utils/fsUtils");
const ProcessorHandles = require("../types/processorHandles");
const path = require("path");
const fs = require("fs/promises");
const calcHashedEntries = require("../info/calcHashedEntries");
const hashedEntriesCache = require("../info/hashedEntriesCache");
const calcDiff = require("../utils/calcDiff");
const buildDiff = require("../actions/buildDiff");
const WriteEntriesManager = require("../info/writeEntriesManager");
const wrules = require("../info/wrules");
const wproject = require("../info/wproject");
const BuildInstance = require("../types/buildInstance");
async function cmdBuild(args) {
    const argPath = args.path;
    const root = await findRoot(argPath);
    if (root === null) {
        console.error("Project not initialised: no project root found.");
        return;
    }
    const manifest = await wproject.createProjectManifest(root, args);
    if (manifest.cmd.build.clean) {
        await cleanBuild(root);
    }
    let writeEntries = new WriteEntriesManager();
    let buildInstance = new BuildInstance(root, manifest);
    const gotBuildInfo = await buildInfo.readBuildInfo(root);
    const unwrappedBuildInfo = buildInfo.unwrapBuildInfo(buildInstance, writeEntries, gotBuildInfo);
    buildInstance
        .withHashedEntries(unwrappedBuildInfo.hashedEntries)
        .withRules(unwrappedBuildInfo.cachedRules)
        .withProcs(unwrappedBuildInfo.cachedProcessors, unwrappedBuildInfo.cachedProcessorsFlat);
    // ProcessorHandles.setCache(unwrappedBuildInfo.cachedProcessors)
    // hashedEntriesCache.setHashedEntriesCache(unwrappedBuildInfo.hashedEntries)
    const srcPath = path.join(root, "src");
    if (!await fsUtils.exists(srcPath)) {
        await fs.mkdir(srcPath, { recursive: true });
    }
    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);
    // this does not specify whether the changed item is a file or a directory
    // this info is contained in srcContents
    // a changed item must be a file, and exists in srcContents
    const hashedDiff = calcDiff.calcDiff(unwrappedBuildInfo.hashedEntries, hashedEntries);
    // wrules.setCachedRules(unwrappedBuildInfo.cachedRules)
    // wrules.initRules(srcContents)
    await fs.mkdir(path.join(root, "dist"), { recursive: true });
    await buildDiff(buildInstance, srcContents, hashedDiff, hashedEntries);
}
module.exports = cmdBuild;
//# sourceMappingURL=cmdBuild.js.map