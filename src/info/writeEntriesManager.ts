import type writeEntry = require("../types/writeEntry")

let globalWriteEntries: Map<string, writeEntry.WriteEntry> | null = null;

function getGlobalWriteEntries(): Map<string, writeEntry.WriteEntry> {
    if(globalWriteEntries === null) {
        throw new Error("attempt to access globalWriteEntries outside of buildDiff")
    } else {
        return globalWriteEntries
    }
}

function clearGlobalWriteEntries(): void {
    globalWriteEntries = null;
}

function initGlobalWriteEntries(): void {
    globalWriteEntries = new Map();
}

export = {
    clearGlobalWriteEntries,
    initGlobalWriteEntries,
    getGlobalWriteEntries
}
