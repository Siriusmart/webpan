"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let hashedEntryCache = undefined;
function setHashedEntriesCache(entries) {
    hashedEntryCache = entries;
}
function getHashedEntriesCache() {
    if (hashedEntryCache === undefined) {
        throw new Error("Getting hashedEntryCache before initialisation");
    }
    return hashedEntryCache;
}
/*
export = {
    getHashedEntriesCache,
    setHashedEntriesCache
}
*/
//# sourceMappingURL=hashedEntriesCache.js.map