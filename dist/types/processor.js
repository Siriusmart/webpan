"use strict";
const ProcessorHandle = require("./processorHandle");
class Processor {
    handle;
    allHandles;
    constructor(allHandles, meta) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this);
    }
}
module.exports = Processor;
//# sourceMappingURL=processor.js.map