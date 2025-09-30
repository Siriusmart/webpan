import assert = require("assert");
import fsContentCache = require("../info/fsContentCache");
import type procEntries = require("./procEntries");
import type Processor = require("./processor");
import type processorStates = require("./processorStates");
import path = require("path");
import writeEntry = require("../types/writeEntry")
import calcDiff = require("../utils/calcDiff");
import WriteEntriesManager = require("../info/writeEntriesManager")
import random = require("../utils/random")

export = ProcessorHandle

let handlesMap: Map<string, ProcessorHandle> = new Map()

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
    id: string;
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, Set<ProcessorHandle>>>;
    writeEntries: WriteEntriesManager;
    dependents: Set<ProcessorHandle>;
    dependencies: Set<ProcessorHandle>;

    static getHandle(id: string): ProcessorHandle | null {
        return handlesMap.get(id) ?? null
    }

    static getHandlesIdMap(): Map<string, ProcessorHandle> {
        return handlesMap
    }

    constructor(handles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, processor: Processor, writeEntries: WriteEntriesManager, id?: string) {
        this.id = id ?? random.hexString(8, (id) => !handlesMap.has(id))
        handlesMap.set(this.id, this)
        this.state = {
            status: "empty",
        };
        this.writeEntries = writeEntries;
        this.meta = meta;
        this.handles = handles;
        this.processor = processor;
        this.dependents = new Set();
        this.dependencies = new Set();
    }

    drop(): void {
        if(!handlesMap.delete(this.id)) {
            throw new Error("You called drop twice!")
        }
    }

    dependsOn(needle: ProcessorHandle): boolean {
        return Array.from(this.dependents).some((dependent) => dependent.dependsOn(needle))
    }

    isOrDependsOn(needle: ProcessorHandle): boolean {
        return needle === this || this.dependsOn(needle);
    }

    reset(): void {
        if("result" in this.state) {
            this.state.result.files.forEach(toDelete => this.writeEntries.set(toDelete, { processor: this, content: "remove"}))
        }

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

    updateWithOutput(output: processorStates.ProcessorOutput, writeEntries: Map<string, writeEntry.WriteEntry>) {
        normaliseOutput(output, this.meta);
        const previousOutput: Set<string> = "result" in this.state ? this.state.result.files : new Set();
        const previousOutputMap: Map<string, any> = new Map(Array.from(previousOutput).map(filePath => [filePath, null]));
        const outputDiff = calcDiff.calcDiff(previousOutputMap, output.files)

        for(let [filePath, difftype] of outputDiff.entries()) {
            if(writeEntries.has(filePath)) {
                const previousWriter = writeEntries.get(filePath);
                if(previousWriter?.content !== "remove") {
                    console.warn(`${this.getIdent().join('#')} is trying to write to ${filePath}, but it is already modified by ${previousWriter?.processor.meta.childPath}#${previousWriter?.processor.meta.procName}!`)
                }
            }

            let content: Buffer | "remove";
            switch(difftype) {
                case "changed":
                    case "created":
                    content = output.files.get(filePath) as Buffer;
                break;
                case "removed":
                    if(writeEntries.has(filePath)) {
                    continue;
                }
                content = "remove"
            }

            const writeEntry: writeEntry.WriteEntry = {
                content,
                processor: this
            }
            writeEntries.set(filePath, writeEntry);
        }
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
            this.updateWithOutput(output, this.writeEntries.getBuffer())

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

