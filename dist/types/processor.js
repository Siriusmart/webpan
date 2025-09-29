"use strict";
const ProcessorHandle = require("./processorHandle");
class Processor {
    handle;
    allHandles;
    constructor(allHandles, meta, id) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this, id);
    }
}
module.exports = Processor;
//# sourceMappingURL=processor.js.map