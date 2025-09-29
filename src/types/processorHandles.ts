import Processor = require("./processor");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");

let cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> = new Map();

export = class ProcessorHandles {
    static getCache(): Map<string, Map<string, Set<ProcessorHandle>>> {
        return cachedProcessors
    }

    static setCache(value: Map<string, Map<string, Set<ProcessorHandle>>>): void {
        cachedProcessors = value
    }
    // handles: Map<string, Map<string, ProcessorHandle>>; // wrong
    /*
    handle: ProcessorHandle;

    // ident is the identifier of the processor this is passed to
    // a unique ProcessorHandles is passed to each processor
    constructor([filePath, procIdent]: [string, string], handles: Map<string, Map<string, ProcessorHandle>>) {
        this.handles = handles;
        this.handle = handles.get(filePath)?.get(procIdent)!;
    }
    */

    /*
    async getResult(file: string, processorName: string): Promise<processorStates.ProcessorResult | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        return await fileHandles.get(processorName)?.getResult([file, processorName]);
    }

    async getProcessor(file: string, processorName: string): Promise<Processor | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        this.handle.dependencies.add([file, processorName]);
        return await fileHandles.get(processorName)?.getProcessor([file, processorName]);
    }
    */
}
