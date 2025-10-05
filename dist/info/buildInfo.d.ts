import type BuildInstance = require("../types/buildInstance");
import type WriteEntriesManager = require("../info/writeEntriesManager");
import type ProcessorHandle = require("../types/processorHandle");
import type wmanifest = require("../types/wmanifest");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type ruleEntry = require("../types/ruleEntry");
interface BuildResultEntry {
    id: string;
    meta: procEntries.ProcessorMetaEntry;
    state: ["ok", {
        files: string[];
        result: any;
    }] | ["err", string] | ["empty"];
    dependents: string[];
    dependencies: string[];
}
interface BuildInfo {
    hashedEntries: Map<string, string | null>;
    buildCache: BuildResultEntry[];
    rules: Map<string, ruleEntry.RuleEntryNormalised>;
}
declare function readBuildInfo(root: string): Promise<BuildInfo>;
declare function writeBuildInfo(root: string, manifest: wmanifest.WManifest, data: BuildInfo): Promise<void>;
declare function wrapBuildInfo(hashedEntries: fsEntries.HashedEntries, cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>, cachedRules: Map<string, ruleEntry.RuleEntryNormalised>): BuildInfo;
declare function unwrapBuildInfo(buildInstance: BuildInstance, writeEntries: WriteEntriesManager, buildInfo: BuildInfo): {
    hashedEntries: fsEntries.HashedEntries;
    cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>;
    cachedProcessorsFlat: Map<string, ProcessorHandle>;
    cachedRules: Map<string, ruleEntry.RuleEntryNormalised>;
};
declare const _default: {
    readBuildInfo: typeof readBuildInfo;
    writeBuildInfo: typeof writeBuildInfo;
    wrapBuildInfo: typeof wrapBuildInfo;
    unwrapBuildInfo: typeof unwrapBuildInfo;
};
export = _default;
//# sourceMappingURL=buildInfo.d.ts.map