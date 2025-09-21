"use strict";
const Processor = require("./processor");
const ProcessorHandle = require("./processorHandle");
module.exports = class ProcessorHandles {
    handles;
    handle;
    // ident is the identifier of the processor this is passed to
    // a unique ProcessorHandles is passed to each processor
    constructor([filePath, procIdent], handles) {
        this.handles = handles;
        this.handle = handles.get(filePath)?.get(procIdent);
    }
};
//# sourceMappingURL=processorHandles.js.map