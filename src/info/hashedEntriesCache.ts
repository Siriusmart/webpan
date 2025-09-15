import path = require("path");
import type fsEntries = require("../types/fsEntries");
import fs = require("fs/promises");
import fsUtils = require("../utils/fsUtils");

let hashedEntryCache: undefined | fsEntries.HashedEntries = undefined;

async function setHashedEntriesCache(root: string, entries: fsEntries.HashedEntries): Promise<void> {
    hashedEntryCache = entries;

    const cachePath = path.join(root, "meta", "hashes.json");
    await fsUtils.writeCreate(cachePath, JSON.stringify(entries));
}

async function getHashedEntriesCache(root: string): Promise<fsEntries.HashedEntries> {
    if(hashedEntryCache !== undefined) {
        return hashedEntryCache;
    }

    const cachePath = path.join(root, "meta", "hashes.json");

    if(await fsUtils.exists(cachePath)) {
        try {
            const content = await fs.readFile(cachePath, { encoding: "utf8" });
            const hashedEntries = JSON.parse(content) as fsEntries.HashedEntries;
            hashedEntryCache = hashedEntries;
            return hashedEntries;
        } catch (e) {
            console.warn(`Failed parsing ${cachePath}, assuming blank. Caused by ${e}`);
        }
    }

    return new Map();
}

export = {
    getHashedEntriesCache,
    setHashedEntriesCache
}
