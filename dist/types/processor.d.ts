import type procEntries = require("./procEntries");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
declare const _default: {
    new (allHandles: Map<string, Map<string, ProcessorHandle>>, meta: procEntries.ProcessorMetaEntry): {
        handle: ProcessorHandle;
        allHandles: Map<string, Map<string, ProcessorHandle>>;
        build(): Promise<processorStates.ProcessorResult>;
    };
};
export = _default;
//# sourceMappingURL=processor.d.ts.map