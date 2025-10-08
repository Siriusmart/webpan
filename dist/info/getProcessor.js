"use strict";
const path = require("path");
const Processor = require("../types/processor");
const fsUtils = require("../utils/fsUtils");
let cachedProcessorClasses = new Map();
async function getProcessor(root, ident) {
    const cachedProcessor = cachedProcessorClasses.get(ident);
    if (cachedProcessor !== undefined) {
        return cachedProcessor;
    }
    const procPath = path.join(root, "node_modules", ident);
    if (!await fsUtils.existsDir(procPath)) {
        throw new Error(`Processor not found: no directory at ${procPath}`);
    }
    const procClass = (require(ident) ?? {}).default;
    if (typeof procClass !== "function") {
        throw new Error(`Package ${ident} doesn't seem to be a webpan processor`);
    }
    cachedProcessorClasses.set(ident, procClass);
    return procClass;
}
module.exports = getProcessor;
//# sourceMappingURL=getProcessor.js.map