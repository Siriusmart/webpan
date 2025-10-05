import type procEntries = require("./procEntries");
import type processorStates = require("./processorStates");
import type BuildInstance = require("./buildInstance");

import ProcessorHandle = require("./processorHandle");

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
