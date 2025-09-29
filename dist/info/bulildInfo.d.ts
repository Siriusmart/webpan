import fsEntries = require("../types/fsEntries");
import procEntries = require("../types/procEntries");
import ProcessorHandle = require("../types/processorHandle");
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
    hashedEntries: fsEntries.HashedEntries;
    buildCache: BuildResultEntry[];
}
declare function readBuildInfo(root: string): Promise<BuildInfo>;
declare function writeBuildInfo(root: string, data: BuildInfo): Promise<void>;
declare function wrapBuildInfo(hashedEntries: fsEntries.HashedEntries, cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>): BuildInfo;
declare function unwrapBuildInfo(buildInfo: BuildInfo): {
    hashedEntries: fsEntries.HashedEntries;
    cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>;
};
declare const _default: {
    readBuildInfo: typeof readBuildInfo;
    writeBuildInfo: typeof writeBuildInfo;
    wrapBuildInfo: typeof wrapBuildInfo;
    unwrapBuildInfo: typeof unwrapBuildInfo;
};
export = _default;
//# sourceMappingURL=bulildInfo.d.ts.map