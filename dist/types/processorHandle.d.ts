export = ProcessorHandle;
import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");
declare class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, Set<ProcessorHandle>>>;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;
    constructor(handles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, processor: Processor);
    dependsOn(needle: ProcessorHandle): boolean;
    isOrDependsOn(needle: ProcessorHandle): boolean;
    reset(): void;
    getIdent(): [string, string];
    hasResult(): boolean;
    hasProcessor(): boolean;
    buildWithBuffer(): Promise<processorStates.ProcessorResult>;
    getResult(requester: ProcessorHandle): Promise<processorStates.ProcessorResult>;
    getProcessor(requester: ProcessorHandle): Promise<Processor>;
}
//# sourceMappingURL=processorHandle.d.ts.map