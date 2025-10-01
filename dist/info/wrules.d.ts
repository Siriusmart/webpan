import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type ruleEntry = require("../types/ruleEntry");
import WriteEntriesManager = require("../info/writeEntriesManager");
declare function setCachedRules(rules: Map<string, ruleEntry.RuleEntryNormalised>): void;
declare function updateRules(root: string, fsEntries: fsEntries.FsContentEntries, writeEntries: WriteEntriesManager, diff: procEntries.DiffEntries<string>): Promise<void>;
declare function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined;
declare function getAllRules(): Map<string, ruleEntry.RuleEntryNormalised>;
interface FoundProcessorEntry {
    processorClass: procEntries.ProcClass;
    settings: any;
    relativePath: string;
    ruleLocation: string;
    pattern: string;
    procName: string;
}
declare function resolveProcessors(root: string, dirCursor: string, fileName?: string): Promise<Set<FoundProcessorEntry>>;
declare const _default: {
    setCachedRules: typeof setCachedRules;
    getRule: typeof getRule;
    getAllRules: typeof getAllRules;
    updateRules: typeof updateRules;
    resolveProcessors: typeof resolveProcessors;
};
export = _default;
//# sourceMappingURL=wrules.d.ts.map