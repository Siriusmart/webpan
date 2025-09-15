import type fsEntries = require("../types/fsEntries");
declare function setHashedEntriesCache(root: string, entries: fsEntries.HashedEntries): Promise<void>;
declare function getHashedEntriesCache(root: string): Promise<fsEntries.HashedEntries>;
declare const _default: {
    getHashedEntriesCache: typeof getHashedEntriesCache;
    setHashedEntriesCache: typeof setHashedEntriesCache;
};
export = _default;
//# sourceMappingURL=hashedEntriesCache.d.ts.map