"use strict";
const ProcessorHandle = require("./processorHandle");
class Processor {
    handle;
    allHandles;
    constructor(allHandles, writeEntries, meta, id) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this, writeEntries, id);
    }
}
module.exports = Processor;
//# sourceMappingURL=processor.js.map