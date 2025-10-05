"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let fsContentCache = null;
function setFsContentCache(content) {
    fsContentCache = content;
}
function getFsContentCache() {
    if (fsContentCache === null) {
        throw new Error("attempted to access fsContentCache outside of building");
    }
    return fsContentCache;
}
function clearFsContentCache() {
    fsContentCache = null;
}
/*
export = {
    getFsContentCache,
    setFsContentCache,
    clearFsContentCache
}
*/
//# sourceMappingURL=fsContentCache.js.map