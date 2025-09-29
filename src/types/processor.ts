import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");

abstract class Processor {
    handle: ProcessorHandle;
    allHandles: Map<string, Map<string, Set<ProcessorHandle>>>

    constructor(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, id?: string) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this, id);
    }

    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}

export = Processor
