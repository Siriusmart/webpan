import type ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
import type BuildInstance = require("./buildInstance");
declare const _default: {
    new (): {};
    buildOutputAll(buildInstance: BuildInstance): Promise<Set<[ProcessorHandle, processorStates.ProcessorOutput]>>;
};
export = _default;
//# sourceMappingURL=processorHandles.d.ts.map