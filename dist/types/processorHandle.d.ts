import type procEntries = require("./procEntries");
import type Processor = require("./processor");
import type processorStates = require("./processorStates");
import type BuildInstance = require("../types/buildInstance");
import type writeEntry = require("../types/writeEntry");
export = ProcessorHandle;
declare class ProcessorHandle {
    id: string;
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    buildInstance: BuildInstance;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;
    constructor(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, processor: Processor, id?: string);
    drop(): void;
    dependsOn(needle: ProcessorHandle): boolean;
    isOrDependsOn(needle: ProcessorHandle): boolean;
    reset(): void;
    getIdent(): [string, string];
    hasResult(): boolean;
    hasProcessor(): boolean;
    updateWithOutput(output: processorStates.ProcessorOutput, writeEntries: Map<string, writeEntry.WriteEntry>): void;
    pendingResultPromise(): {
        promise: Promise<["ok", processorStates.ProcessorResult] | ["err", any]>;
        resolve: (result: processorStates.ProcessorResult) => void;
        reject: (err: any) => void;
    };
    unwrapPendingResult(res: ["ok", processorStates.ProcessorResult] | ["err", any]): processorStates.ProcessorResult;
    buildWithBuffer(buildInstance: BuildInstance): Promise<processorStates.ProcessorResult>;
    getResult(requester: ProcessorHandle): Promise<processorStates.ProcessorResult>;
    getProcessor(buildInstance: BuildInstance, requester: ProcessorHandle): Promise<Processor>;
}
//# sourceMappingURL=processorHandle.d.ts.map