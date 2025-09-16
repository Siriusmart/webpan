"use strict";
const Processor = require("./processor");
module.exports = class ProcessorHandle {
    state;
    getResult() {
        throw new Error();
    }
    getProcessor() {
        throw new Error();
    }
};
//# sourceMappingURL=processorHandle.js.map