"use strict";
const Processor = require("./processor");
const ProcessorHandle = require("./processorHandle");
module.exports = class ProcessorHandles {
    handles;
    constructor(handles) {
        this.handles = handles;
    }
    async getResult(file, processorName) {
        const fileHandles = this.handles.get(file);
        if (fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }
        return await fileHandles.get(processorName)?.getResult();
    }
    async getProcessor(file, processorName) {
        const fileHandles = this.handles.get(file);
        if (fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }
        return await fileHandles.get(processorName)?.getProcessor();
    }
};
//# sourceMappingURL=processorHandles.js.map