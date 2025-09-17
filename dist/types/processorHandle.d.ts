export = ProcessorHandle;
import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");
declare class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, ProcessorHandle>>;
    constructor(handles: Map<string, Map<string, ProcessorHandle>>, meta: procEntries.ProcessorMetaEntry, processor: Processor);
    getResult(): Promise<processorStates.ProcessorResult>;
    getProcessor(): Promise<Processor>;
}
//# sourceMappingURL=processorHandle.d.ts.map