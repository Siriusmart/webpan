"use strict";
const ProcessorHandle = require("./processorHandle");
module.exports = class Processor {
    handle;
    allHandles;
    constructor(allHandles, meta) {
        this.allHandles = allHandles;
        this.handle = new ProcessorHandle(allHandles, meta, this);
    }
    async build(content) {
        throw new Error();
    }
};
//# sourceMappingURL=processor.js.map