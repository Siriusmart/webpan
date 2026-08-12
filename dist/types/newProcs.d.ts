import type ProcessorHandle from "./processorHandle.js";
export type NewProcsAbsolute = Map<string, Set<string>>;
export default class NewProcs {
    private absolute;
    private handle;
    constructor(absolute: NewProcsAbsolute, handle: ProcessorHandle);
    files(options?: {
        absolute?: boolean;
        include?: string;
    }): Map<string, Set<string>>;
}
//# sourceMappingURL=newProcs.d.ts.map