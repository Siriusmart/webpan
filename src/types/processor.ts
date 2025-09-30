import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
import type writeEntry = require("./writeEntry");
import type WriteEntriesManager = require("../info/writeEntriesManager");

abstract class Processor {
    handle: ProcessorHandle;
    allHandles: Map<string, Map<string, Set<ProcessorHandle>>>

    constructor(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, writeEntries: WriteEntriesManager, meta: procEntries.ProcessorMetaEntry, id?: string) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this, writeEntries, id);
    }

    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}

export = Processor
