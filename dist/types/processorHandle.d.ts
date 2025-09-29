import type procEntries = require("./procEntries");
import type Processor = require("./processor");
import type processorStates = require("./processorStates");
import writeEntry = require("../types/writeEntry");
export = ProcessorHandle;
declare class ProcessorHandle {
    id: string;
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, Set<ProcessorHandle>>>;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;
    static getHandle(id: string): ProcessorHandle | null;
    static getHandlesIdMap(): Map<string, ProcessorHandle>;
    constructor(handles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, processor: Processor, id?: string);
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
    buildWithBuffer(): Promise<processorStates.ProcessorResult>;
    getResult(requester: ProcessorHandle): Promise<processorStates.ProcessorResult>;
    getProcessor(requester: ProcessorHandle): Promise<Processor>;
}
//# sourceMappingURL=processorHandle.d.ts.map