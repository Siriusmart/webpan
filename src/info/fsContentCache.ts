import type fsEntries = require("../types/fsEntries");

let fsContentCache: fsEntries.FsContentEntries | null = null;

function setFsContentCache(content: fsEntries.FsContentEntries): void {
    fsContentCache = content;
}

function getFsContentCache(): fsEntries.FsContentEntries {
    if(fsContentCache === null) {
        throw new Error("attempted to access fsContentCache outside of building")
    }

    return fsContentCache
}

function clearFsContentCache(): void {
    fsContentCache = null;
}

export = {
    getFsContentCache,
    setFsContentCache,
    clearFsContentCache
}
