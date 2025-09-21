import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
declare const _default: {
    new (allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry): {
        handle: ProcessorHandle;
        allHandles: Map<string, Map<string, Set<ProcessorHandle>>>;
        build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
    };
};
export = _default;
//# sourceMappingURL=processor.d.ts.map