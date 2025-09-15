"use strict";
const yargs = require("yargs");
const findRoot = require("../info/findRoot");
const cleanBuild = require("../actions/cleanBuild");
const fsUtils = require("../utils/fsUtils");
const path = require("path");
const calcHashedEntries = require("../info/calcHashedEntries");
const hashedEntriesCache = require("../info/hashedEntriesCache");
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
    const srcContents = await fsUtils.readDirRecursive(srcPath);
    const hashedEntries = calcHashedEntries(srcContents);
    const cachedHashedEntries = await hashedEntriesCache.getHashedEntriesCache(root);
}
module.exports = cmdBuild;
//# sourceMappingURL=cmdBuild.js.map