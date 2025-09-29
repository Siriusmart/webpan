"use strict";
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
module.exports = {
    getHashedEntriesCache,
    setHashedEntriesCache
};
//# sourceMappingURL=hashedEntriesCache.js.map