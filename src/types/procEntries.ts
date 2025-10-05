import type Processor = require("./processor")
import type ProcessorHandle = require("./processorHandle")
import type writeEntry = require("./writeEntry")
import type WriteEntriesManager = require("../info/writeEntriesManager")
import type BuildInstance = require("../types/buildInstance")
import type procEntries = require("../types/procEntries")

export type ProcByFileMap = Map<string, Map<string, Set<ProcessorHandle>>>;
export type ProcByIdMap = Map<string, ProcessorHandle>

export interface ProcessorMetaEntry {
    // fullPath: string,
    childPath: string,
    procName: string,
    relativePath: string,
    ruleLocation: string,
    // pattern: string,
    settings: any,
}
export type ProcClass = { new(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, id?: string): Processor }
export type DiffType = "changed" | "removed" | "created";
export type DiffEntries<K> = Map<K, DiffType>;
