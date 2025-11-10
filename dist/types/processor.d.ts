import type BuildInstance = require("./buildInstance");
import type procEntries = require("./procEntries");
import type processorStates = require("./processorStates");
import ProcessorHandle = require("./processorHandle");
declare class FileNamedProcOne {
    private parent;
    private proc;
    constructor(parent: ProcessorHandle, proc: ProcessorHandle);
    getResult(): Promise<processorStates.ProcessorResult>;
    getProcessor(): Promise<Processor>;
}
declare class FileNamedProcs {
    private parent;
    private procsSet;
    constructor(parent: ProcessorHandle, procsSet: Set<ProcessorHandle>);
    values(): IteratorObject<FileNamedProcOne>;
    toSet(): Set<FileNamedProcOne>;
}
declare class FileProcs {
    private parent;
    private procsMap;
    constructor(parent: ProcessorHandle, procsMap: Map<string, Set<ProcessorHandle>>);
    procs(options?: {
        pattern?: string;
    }): Map<string, FileNamedProcs>;
}
declare abstract class Processor {
    __handle: ProcessorHandle;
    private buildInstance;
    constructor(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, id?: string);
    filePath(options?: {
        absolute?: boolean;
    }): string;
    files(options?: {
        pattern?: string;
        absolute?: boolean;
    }): Map<string, FileProcs>;
    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}
export = Processor;
//# sourceMappingURL=processor.d.ts.map