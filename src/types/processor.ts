import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");

export = class Processor {
    handle: ProcessorHandle;
    allHandles: Map<string, Map<string, Set<ProcessorHandle>>>

    constructor(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this);
    }

    async build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput> {
        throw new Error()
    }
}
