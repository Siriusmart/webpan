import type writeEntry = require("../types/writeEntry");
type WriteEntryManagerState = "writable" | "readonly" | "disabled";
declare class WriteEntriesManager {
    bufferedContent: Map<string, writeEntry.WriteEntry>;
    state: WriteEntryManagerState;
    set(path: string, content: writeEntry.WriteEntry): void;
    get(path: string): undefined | writeEntry.WriteEntry;
    setState(state: WriteEntryManagerState): void;
    getBuffer(): Map<string, writeEntry.WriteEntry>;
}
export = WriteEntriesManager;
//# sourceMappingURL=writeEntriesManager.d.ts.map