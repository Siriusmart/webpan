"use strict";
let globalWriteEntries = null;
function getGlobalWriteEntries() {
    if (globalWriteEntries === null) {
        throw new Error("attempt to access globalWriteEntries outside of buildDiff");
    }
    else {
        return globalWriteEntries;
    }
}
function clearGlobalWriteEntries() {
    globalWriteEntries = null;
}
function initGlobalWriteEntries() {
    globalWriteEntries = new Map();
}
module.exports = {
    clearGlobalWriteEntries,
    initGlobalWriteEntries,
    getGlobalWriteEntries
};
//# sourceMappingURL=writeEntriesManager.js.map