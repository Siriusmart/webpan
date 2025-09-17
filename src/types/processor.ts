import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");

export = class Processor {
    handle: ProcessorHandle;
    allHandles: Map<string, Map<string, ProcessorHandle>>

    constructor(allHandles: Map<string, Map<string, ProcessorHandle>>, meta: procEntries.ProcessorMetaEntry) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this);
    }

    async build(): Promise<processorStates.ProcessorResult> {
        throw new Error()
    }
}
