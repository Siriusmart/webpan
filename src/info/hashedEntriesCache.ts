import type fsEntries = require("../types/fsEntries");

let hashedEntryCache: undefined | fsEntries.HashedEntries = undefined;

function setHashedEntriesCache(entries: fsEntries.HashedEntries): void {
    hashedEntryCache = entries;
}

function getHashedEntriesCache(): fsEntries.HashedEntries {
    if(hashedEntryCache === undefined) {
        throw new Error("Getting hashedEntryCache before initialisation")
    }

    return hashedEntryCache;
}

export = {
    getHashedEntriesCache,
    setHashedEntriesCache
}
