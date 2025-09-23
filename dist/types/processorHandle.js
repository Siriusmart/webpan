"use strict";
const assert = require("assert");
const fsContentCache = require("../info/fsContentCache");
const Processor = require("./processor");
const path = require("path");
function normaliseOutput(output, meta) {
    output.files = new Map(output.files.entries().map(([filePath, buffer]) => {
        if (!filePath.startsWith('/')) {
            filePath = path.normalize(path.join(meta.childPath, filePath));
        }
        else {
            filePath = path.normalize(filePath);
        }
        return [filePath, buffer];
    }));
}
class ProcessorHandle {
    state;
    meta;
    processor;
    handles;
    dependents;
    dependencies;
    constructor(handles, meta, processor) {
        const { promise, resolve, reject } = Promise.withResolvers();
        this.state = {
            status: "empty",
            pendingResult: promise,
            resolve,
            reject
        };
        this.meta = meta;
        this.handles = handles;
        this.processor = processor;
        this.dependents = new Set();
        this.dependencies = new Set();
    }
    dependsOn(needle) {
        return Array.from(this.dependents).some((dependent) => dependent.dependsOn(needle));
    }
    isOrDependsOn(needle) {
        return needle === this || this.dependsOn(needle);
    }
    reset() {
        if (this.state.status === "empty") {
            return;
        }
        const { promise, resolve, reject } = Promise.withResolvers();
        this.state = {
            status: "empty",
            pendingResult: promise,
            resolve,
            reject
        };
        this.dependencies.forEach((handle) => handle.dependents.delete(this));
        this.dependents.forEach((handle) => handle.reset());
    }
    getIdent() {
        return [this.meta.childPath, this.meta.procName];
    }
    hasResult() {
        return this.state.status === "resultonly" || this.state.status === "built";
    }
    hasProcessor() {
        return this.state.status === "built";
    }
    async buildWithBuffer() {
        const contentEntry = fsContentCache.getFsContentCache().get(this.meta.childPath);
        assert(contentEntry !== undefined);
        let content;
        switch (contentEntry.content[0]) {
            case "file":
                content = contentEntry.content[1];
                break;
            case "dir":
                content = "dir";
                break;
        }
        const pendingResult = new Promise(async (res, rej) => {
            try {
                let output = await this.processor.build(content);
                normaliseOutput(output, this.meta);
                this.state = {
                    status: "built",
                    processor: this.processor,
                    result: {
                        result: output.result,
                        files: new Set(output.files.keys())
                    }
                };
                res(this.state.result);
            }
            catch (err) {
                this.state = {
                    status: "error",
                    err
                };
                rej(err);
            }
        });
        this.reset();
        this.state = {
            status: "building",
            pendingResult: pendingResult
        };
        return await pendingResult;
    }
    // need mechanism to detect dead locks
    async getResult(requester) {
        if (this.isOrDependsOn(requester)) {
            throw new Error("There is a cycle in dependency.");
        }
        this.dependents.add(requester);
        requester.dependencies.add(this);
        switch (this.state.status) {
            case "resultonly":
            case "built":
                return this.state.result;
            case "empty":
                throw new Error("processor is not being built and will not be resolved");
            case "building":
                return await this.state.pendingResult;
            case "error":
                throw this.state.err;
        }
    }
    async getProcessor(requester) {
        if (this.isOrDependsOn(requester)) {
            throw new Error("There is a cycle in dependency.");
        }
        this.dependents.add(requester);
        requester.dependencies.add(this);
        switch (this.state.status) {
            case "resultonly":
                await this.buildWithBuffer();
                return this.processor;
            case "empty":
                throw new Error("processor is not being built and will not be resolved");
            case "building":
                await this.state.pendingResult;
                return this.processor;
            case "error":
                throw this.state.err;
            case "built":
                return this.processor;
        }
    }
}
module.exports = ProcessorHandle;
//# sourceMappingURL=processorHandle.js.map