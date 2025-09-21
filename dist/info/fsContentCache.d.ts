import type fsEntries = require("../types/fsEntries");
declare function setFsContentCache(content: fsEntries.FsContentEntries): void;
declare function getFsContentCache(): fsEntries.FsContentEntries;
declare function clearFsContentCache(): void;
declare const _default: {
    getFsContentCache: typeof getFsContentCache;
    setFsContentCache: typeof setFsContentCache;
    clearFsContentCache: typeof clearFsContentCache;
};
export = _default;
//# sourceMappingURL=fsContentCache.d.ts.map