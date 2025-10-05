"use strict";
const ProcessorHandle = require("./processorHandle");
class Processor {
    handle;
    buildInstance;
    constructor(buildInstance, meta, id) {
        this.buildInstance = buildInstance;
        this.handle = new ProcessorHandle(buildInstance, meta, this, id);
    }
}
module.exports = Processor;
//# sourceMappingURL=processor.js.map