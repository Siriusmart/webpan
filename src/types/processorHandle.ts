export = ProcessorHandle;

import assert = require("assert");
import fsContentCache = require("../info/fsContentCache");
import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");
import path = require("path");

function normaliseOutput(output: processorStates.ProcessorOutput, meta: procEntries.ProcessorMetaEntry) {
    output.files = new Map(output.files.entries().map(([filePath, buffer]) => {
        if(!filePath.startsWith('/')) {
            filePath = path.normalize(path.join(meta.childPath, filePath))
        } else {
            filePath = path.normalize(filePath)
        }

        return [filePath, buffer]
    }))
}

class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, Set<ProcessorHandle>>>;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;

    constructor(handles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, processor: Processor) {
        this.state = {
            status: "empty",
        };
        this.meta = meta;
        this.handles = handles;
        this.processor = processor;
        this.dependents = new Set();
        this.dependencies = new Set();
    }

    dependsOn(needle: ProcessorHandle): boolean {
        return Array.from(this.dependents).some((dependent) => dependent.dependsOn(needle))
    }

    isOrDependsOn(needle: ProcessorHandle): boolean {
        return needle === this || this.dependsOn(needle);
    }

    reset(): void {
        if(this.state.status === "empty") {
            return
        }

        this.state = {
            status: "empty",
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

    pendingResultPromise(): {
        promise: Promise<["ok", processorStates.ProcessorResult] | ["err", any]>,
        resolve: (result: processorStates.ProcessorResult) => void,
        reject: (err: any) => void,
    } {
        const { promise, resolve } = Promise.withResolvers<["ok", processorStates.ProcessorResult] | ["err", any]>();
        const wrappedResolve = (result: processorStates.ProcessorResult) => {
            resolve(["ok", result])
        }
        const wrappedReject = (err: any) => {
            resolve(["err", err])
        }
        this.state = {
            status: "building",
            pendingResult: promise,
            reject: wrappedReject,
            resolve: wrappedResolve
        }

        return {
            promise,
            reject: wrappedReject,
            resolve: wrappedResolve
        }
    }

    unwrapPendingResult(res: ["ok", processorStates.ProcessorResult] | ["err", any]): processorStates.ProcessorResult {
        switch(res[0]) {
            case "ok":
                return res[1]
            case "err":
                throw res[1]
        }
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

        this.reset();

        const { promise, resolve, reject } = this.pendingResultPromise();
        this.state = {
            status: "building",
            pendingResult: promise,
            reject,
            resolve
        }

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
            }
            resolve(this.state.result);
        } catch(err) {
            this.state = {
                status: "error",
                err
            }
            reject(err);
        }

        return this.unwrapPendingResult(await promise);
    }

    // need mechanism to detect dead locks
    async getResult(requester: ProcessorHandle): Promise<processorStates.ProcessorResult> {
        if(this.isOrDependsOn(requester)) {
            throw new Error("There is a cycle in dependency.")
        }
        this.dependents.add(requester);
        requester.dependencies.add(this);
        switch(this.state.status) {
            case "resultonly":
            case "built":
                return this.state.result;
            case "empty":
                throw new Error("processor is not being built and will not be resolved")
            case "building":
                return this.unwrapPendingResult(await this.state.pendingResult);
            case "error":
                throw this.state.err;
        }
    }

    async getProcessor(requester: ProcessorHandle): Promise<Processor> {
        if(this.isOrDependsOn(requester)) {
            throw new Error("There is a cycle in dependency.")
        }
        this.dependents.add(requester);
        requester.dependencies.add(this);
        switch(this.state.status) {
            case "resultonly":
                await this.buildWithBuffer();
            return this.processor;
            case "empty":
                throw new Error("processor is not being built and will not be resolved")
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
