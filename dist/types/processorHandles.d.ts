import Processor = require("./processor");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
declare const _default: {
    new (handles: Map<string, Map<string, ProcessorHandle>>): {
        handles: Map<string, Map<string, ProcessorHandle>>;
        getResult(file: string, processorName: string): Promise<processorStates.ProcessorResult | undefined>;
        getProcessor(file: string, processorName: string): Promise<Processor | undefined>;
    };
};
export = _default;
//# sourceMappingURL=processorHandles.d.ts.map