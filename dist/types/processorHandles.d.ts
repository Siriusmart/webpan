import type ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
import fsEntries = require("./fsEntries");
declare const _default: {
    new (): {};
    cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>;
    handlesMap: Map<string, ProcessorHandle>;
    getCache(): Map<string, Map<string, Set<ProcessorHandle>>>;
    setCache(value: Map<string, Map<string, Set<ProcessorHandle>>>): void;
    buildOutputAll(fsContent: fsEntries.FsContentEntries): Promise<Set<[ProcessorHandle, processorStates.ProcessorOutput]>>;
};
export = _default;
//# sourceMappingURL=processorHandles.d.ts.map