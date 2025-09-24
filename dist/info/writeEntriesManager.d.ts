import type writeEntry = require("../types/writeEntry");
declare function getGlobalWriteEntries(): Map<string, writeEntry.WriteEntry>;
declare function clearGlobalWriteEntries(): void;
declare function initGlobalWriteEntries(): void;
declare const _default: {
    clearGlobalWriteEntries: typeof clearGlobalWriteEntries;
    initGlobalWriteEntries: typeof initGlobalWriteEntries;
    getGlobalWriteEntries: typeof getGlobalWriteEntries;
};
export = _default;
//# sourceMappingURL=writeEntriesManager.d.ts.map