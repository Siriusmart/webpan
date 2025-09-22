export = ProcessorHandle;

import assert = require("assert");
import fsContentCache = require("../info/fsContentCache");
import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");

class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, Set<ProcessorHandle>>>;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;

    constructor(handles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, processor: Processor) {
        const { promise, resolve, reject } = Promise.withResolvers<processorStates.ProcessorResult>();
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

    reset(): void {
        if(this.state.status === "empty") {
            return
        }

        const { promise, resolve, reject } = Promise.withResolvers<processorStates.ProcessorResult>();
        this.state = {
            status: "empty",
            pendingResult: promise,
            resolve,
            reject
        };
        this.dependencies.forEach((handle) => handle.dependents.delete(this))
        this.dependents.forEach((handle) => handle.reset())
    }

    getIdent(): [string, string] {
        return [this.meta.childPath, this.meta.procName]
    }

    hasResult(): boolean {
        return this.state.status === "resultonly" || this.state.status === "built"
    }

    hasProcessor(): boolean {
        return this.state.status === "built"
    }

    async buildWithBuffer(): Promise<processorStates.ProcessorResult> {
        const contentEntry = fsContentCache.getFsContentCache().get(this.meta.childPath);
        assert(contentEntry !== undefined)
        let content: Buffer | "dir";

        switch(contentEntry.content[0]) {
            case "file":
                content = contentEntry.content[1]
                break
            case "dir":
                content = "dir"
                break
        }

        const pendingResult: Promise<processorStates.ProcessorResult> = new Promise(async (res, rej) => {
            try {
                const output = await this.processor.build(content);

                this.state = {
                    status: "built",
                    processor: this.processor,
                    result: {
                        result: output.result,
                        files: new Set(output.files.keys())
                    }
                }
                res(this.state.result);
            } catch(err) {
                this.state = {
                    status: "error",
                    err
                }
                rej(err);
            }
        })
        this.reset();
        this.state = {
            status: "building",
            processor: this.processor,
            pendingResult: pendingResult
        }
        return await pendingResult;
    }

    // need mechanism to detect dead locks
    async getResult(requester: ProcessorHandle): Promise<processorStates.ProcessorResult> {
        this.dependents.add(requester);
        switch(this.state.status) {
            case "resultonly":
            case "built":
                return this.state.result;
            case "empty":
                return await this.state.pendingResult;
            case "error":
                throw this.state.err;
            case "building":
                return await this.state.pendingResult;
        }
    }

    async getProcessor(requester: ProcessorHandle): Promise<Processor> {
        this.dependents.add(requester);
        switch(this.state.status) {
            case "resultonly":
                await this.buildWithBuffer();
                return this.processor;
            case "building":
            case "empty":
                await this.state.pendingResult;
                return this.processor;
            case "error":
                throw this.state.err;
            case "built":
                return this.processor;
        }
    }
}
