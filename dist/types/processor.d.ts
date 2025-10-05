import type procEntries = require("./procEntries");
import type processorStates = require("./processorStates");
import type BuildInstance = require("./buildInstance");
import ProcessorHandle = require("./processorHandle");
declare abstract class Processor {
    handle: ProcessorHandle;
    buildInstance: BuildInstance;
    constructor(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, id?: string);
    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}
export = Processor;
//# sourceMappingURL=processor.d.ts.map