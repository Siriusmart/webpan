import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");

export = class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;

    constructor(meta: procEntries.ProcessorMetaEntry) {
        this.state = {
            status: "empty"
        };
        this.meta = meta;
    }

    getResult(): processorStates.ProcessorResult {
        throw new Error()
    }

    getProcessor(): Processor {
        throw new Error()
    }
}
