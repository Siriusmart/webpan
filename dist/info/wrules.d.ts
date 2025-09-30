import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type ruleEntry = require("../types/ruleEntry");
declare function initRules(fsEntries: fsEntries.FsContentEntries): void;
declare function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined;
interface FoundProcessorEntry {
    processorClass: procEntries.ProcClass;
    settings: Map<string, any>;
    procDir: string;
    relativePath: string;
    ruleLocation: string;
    pattern: string;
    procName: string;
}
declare function resolveProcessors(root: string, dirCursor: string, fileName?: string): Promise<Set<FoundProcessorEntry>>;
declare const _default: {
    initRules: typeof initRules;
    getRule: typeof getRule;
    resolveProcessors: typeof resolveProcessors;
};
export = _default;
//# sourceMappingURL=wrules.d.ts.map