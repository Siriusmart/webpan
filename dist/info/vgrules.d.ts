import type fsEntries = require("../types/fsEntries");
import type ruleEntry = require("../types/ruleEntry");
declare function initRules(fsEntries: fsEntries.FsContentEntries): void;
declare function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined;
declare const _default: {
    initRules: typeof initRules;
    getRule: typeof getRule;
};
export = _default;
//# sourceMappingURL=vgrules.d.ts.map