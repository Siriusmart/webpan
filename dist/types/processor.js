"use strict";
const micromatch = require("micromatch");
const ProcessorHandle = require("./processorHandle");
const path = require("path");
class FileNamedProcOne {
    parent;
    proc;
    constructor(parent, proc) {
        this.parent = parent;
        this.proc = proc;
    }
    async getResult() {
        return await this.proc.getResult(this.parent);
    }
    async getProcessor() {
        return await this.proc.getProcessor(this.parent);
    }
}
class FileNamedProcs {
    parent;
    procsSet;
    constructor(parent, procsSet) {
        this.parent = parent;
        this.procsSet = procsSet;
    }
    values() {
        return this.procsSet.values().map(proc => new FileNamedProcOne(this.parent, proc));
    }
    toSet() {
        return new Set(this.values());
    }
}
class FileProcs {
    parent;
    procsMap;
    constructor(parent, procsMap) {
        this.parent = parent;
        this.procsMap = procsMap;
    }
    procs(options = {}) {
        let out = new Map();
        for (const [name, fileNamedProcs] of this.procsMap.entries()) {
            if (options.pattern === undefined || micromatch.isMatch(name, options.pattern)) {
                out.set(name, new FileNamedProcs(this.parent, fileNamedProcs));
            }
        }
        return out;
    }
}
class Processor {
    __handle;
    buildInstance;
    constructor(buildInstance, meta, id) {
        this.buildInstance = buildInstance;
        this.__handle = new ProcessorHandle(buildInstance, meta, this, id);
    }
    files(options = {}) {
        let dirPath = this.__handle.meta.childPath;
        if (options.absolute !== true && !dirPath.endsWith('/')) {
            dirPath = path.join(path.dirname(dirPath), "/");
        }
        let out = new Map();
        for (const [absPath, procsMap] of this.buildInstance.getProcByFiles().entries()) {
            let relPath;
            if (options.absolute ?? false) {
                relPath = absPath;
            }
            else {
                if (!absPath.startsWith(dirPath)) {
                    continue;
                }
                relPath = absPath.substring(dirPath.length - 1);
            }
            if (options.pattern === undefined || micromatch.isMatch(relPath, options.pattern)) {
                out.set(relPath, new FileProcs(this.__handle, procsMap));
            }
        }
        return out;
    }
}
module.exports = Processor;
//# sourceMappingURL=processor.js.map