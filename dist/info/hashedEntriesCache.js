"use strict";
const path = require("path");
const fs = require("fs/promises");
const fsUtils = require("../utils/fsUtils");
let hashedEntryCache = undefined;
async function setHashedEntriesCache(root, entries) {
    hashedEntryCache = entries;
    const cachePath = path.join(root, "meta", "hashes.json");
    await fsUtils.writeCreate(cachePath, JSON.stringify(entries));
}
async function getHashedEntriesCache(root) {
    if (hashedEntryCache !== undefined) {
        return hashedEntryCache;
    }
    const cachePath = path.join(root, "meta", "hashes.json");
    if (await fsUtils.exists(cachePath)) {
        try {
            const content = await fs.readFile(cachePath, { encoding: "utf8" });
            const hashedEntries = JSON.parse(content);
            hashedEntryCache = hashedEntries;
            return hashedEntries;
        }
        catch (e) {
            console.warn(`Failed parsing ${cachePath}, assuming blank. Caused by ${e}`);
        }
    }
    return new Map();
}
module.exports = {
    getHashedEntriesCache,
    setHashedEntriesCache
};
//# sourceMappingURL=hashedEntriesCache.js.map