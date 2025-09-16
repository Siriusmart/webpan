"use strict";
const yargs = require("yargs");
const findRoot = require("../info/findRoot");
const cleanBuild = require("../actions/cleanBuild");
const fsUtils = require("../utils/fsUtils");
const path = require("path");
const fs = require("fs/promises");
const calcHashedEntries = require("../info/calcHashedEntries");
const hashedEntriesCache = require("../info/hashedEntriesCache");
const calcDiff = require("../utils/calcDiff");
async function cmdBuild(args) {
    const argPath = args.path;
    const root = await findRoot(argPath);
    if (root === null) {
        console.error("Project not initialised: no project root found.");
        return;
    }
    const doClean = (args.clear ?? false);
    if (doClean) {
        await cleanBuild(root);
    }
    const srcPath = path.join(root, "src");
    if (!await fsUtils.exists(srcPath)) {
        await fs.mkdir(srcPath, { recursive: true });
    }
    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);
    const cachedHashedEntries = await hashedEntriesCache.getHashedEntriesCache(root);
    const hashedDiff = calcDiff.calcDiffByExtractor(cachedHashedEntries, hashedEntries, entry => entry.hash);
    console.log(hashedDiff);
}
module.exports = cmdBuild;
//# sourceMappingURL=cmdBuild.js.map