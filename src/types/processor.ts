import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
import type writeEntry = require("./writeEntry");
import type WriteEntriesManager = require("../info/writeEntriesManager");
import type BuildInstance = require("./buildInstance");

abstract class Processor {
    handle: ProcessorHandle;
    buildInstance: BuildInstance;

    constructor(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, id?: string) {
        this.buildInstance = buildInstance
        this.handle = new ProcessorHandle(buildInstance, meta, this, id);
    }

    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}

export = Processor
