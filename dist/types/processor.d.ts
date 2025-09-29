import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
declare abstract class Processor {
    handle: ProcessorHandle;
    allHandles: Map<string, Map<string, Set<ProcessorHandle>>>;
    constructor(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, id?: string);
    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}
export = Processor;
//# sourceMappingURL=processor.d.ts.map