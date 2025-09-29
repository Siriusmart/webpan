"use strict";
const Processor = require("./processor");
const ProcessorHandle = require("./processorHandle");
let cachedProcessors = new Map();
module.exports = class ProcessorHandles {
    static getCache() {
        return cachedProcessors;
    }
    static setCache(value) {
        cachedProcessors = value;
    }
};
//# sourceMappingURL=processorHandles.js.map