import Processor = require("./processor");
import ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");

export = class ProcessorHandles {
    handles: Map<string, Map<string, ProcessorHandle>>;

    constructor(handles: Map<string, Map<string, ProcessorHandle>>) {
        this.handles = handles;
    }

    async getResult(file: string, processorName: string): Promise<processorStates.ProcessorResult | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        return await fileHandles.get(processorName)?.getResult();
    }

    async getProcessor(file: string, processorName: string): Promise<Processor | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        return await fileHandles.get(processorName)?.getProcessor();
    }
}
