import type wmanifest = require("../types/wmanifest");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type writeEntry = require("../types/writeEntry");
import type ruleEntry = require("../types/ruleEntry");
import type processorStates = require("../types/processorStates");
import type ProcessorHandle = require("../types/processorHandle");
import WriteEntriesManager = require("../info/writeEntriesManager");
declare class BuildInstance {
    private root;
    private manifest;
    private writeEntries;
    private fsContent;
    private fsHashedEntries;
    private fsDiff;
    private procByFiles;
    private procById;
    private rules;
    static normaliseOutput(output: processorStates.ProcessorOutput, meta: procEntries.ProcessorMetaEntry): void;
    constructor(root: string, manifest: wmanifest.WManifest);
    withHashedEntries(hashedEntries: fsEntries.HashedEntries): BuildInstance;
    buildOutputAll(): Promise<Set<[ProcessorHandle, processorStates.ProcessorOutput]>>;
    withFsContent(fsContent: fsEntries.FsContentEntries, hashedEntries: fsEntries.HashedEntries, fsDiff: procEntries.DiffEntries<string>): Promise<BuildInstance>;
    withProcs(procByFiles: procEntries.ProcByFileMap, procById: procEntries.ProcByIdMap): BuildInstance;
    withRules(rules: ruleEntry.RuleEntries): BuildInstance;
    withBuildCycleState(buildCycleState: writeEntry.WriteEntryManagerState): BuildInstance;
    getRoot(): string;
    getWriteEntriesManager(): WriteEntriesManager;
    getFsDiff(): procEntries.DiffEntries<string>;
    getFsContent(): fsEntries.FsContentEntries;
    getFsHashedEntries(): fsEntries.HashedEntries;
    getRules(): ruleEntry.RuleEntries;
    getProcByFiles(): procEntries.ProcByFileMap;
    getProcById(): procEntries.ProcByIdMap;
    clean(): Promise<void>;
    writeMeta(): Promise<void>;
}
export = BuildInstance;
//# sourceMappingURL=buildInstance.d.ts.map