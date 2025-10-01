import type Processor = require("./processor");
import type ProcessorHandle = require("./processorHandle");
import type WriteEntriesManager = require("../info/writeEntriesManager");
export interface ProcessorMetaEntry {
    fullPath: string;
    childPath: string;
    procName: string;
    relativePath: string;
    ruleLocation: string;
    settings: any;
}
export type ProcClass = {
    new (allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, writeEntries: WriteEntriesManager, meta: ProcessorMetaEntry, id?: string): Processor;
};
export type DiffType = "changed" | "removed" | "created";
export type DiffEntries<K> = Map<K, DiffType>;
//# sourceMappingURL=procEntries.d.ts.map