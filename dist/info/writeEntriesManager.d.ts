import type writeEntry = require("../types/writeEntry");
declare class WriteEntriesManager {
    bufferedContent: Map<string, writeEntry.WriteEntry>;
    state: writeEntry.WriteEntryManagerState;
    set(path: string, content: writeEntry.WriteEntry): void;
    get(path: string): undefined | writeEntry.WriteEntry;
    setState(state: writeEntry.WriteEntryManagerState): void;
    getBuffer(): Map<string, writeEntry.WriteEntry>;
}
export = WriteEntriesManager;
//# sourceMappingURL=writeEntriesManager.d.ts.map