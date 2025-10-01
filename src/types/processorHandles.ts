import assert = require("assert");
import type Processor = require("./processor");
import type ProcessorHandle = require("./processorHandle");
import type processorStates = require("./processorStates");
import fsEntries = require("./fsEntries")

export = class ProcessorHandles {
    // [fileName, procName] => proc set
    static cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> = new Map()
    // id => proc
    static handlesMap: Map<string, ProcessorHandle> = new Map()

    static getCache(): Map<string, Map<string, Set<ProcessorHandle>>> {
        return this.cachedProcessors
    }

    static setCache(value: Map<string, Map<string, Set<ProcessorHandle>>>): void {
        this.cachedProcessors = value
    }

    static async buildOutputAll(fsContent: fsEntries.FsContentEntries): Promise<Set<[ProcessorHandle, processorStates.ProcessorOutput]>> {
        let toBuild: Set<ProcessorHandle> = new Set()

        for(const proc of this.handlesMap.values()) {
            if(proc.state.status !== "empty") {
                continue;
            }

            const { promise, resolve, reject } = proc.pendingResultPromise();
            proc.state = {
                status: "building",
                pendingResult: promise,
                reject,
                resolve
            }

            toBuild.add(proc)
        }

        let res: Set<[ProcessorHandle, processorStates.ProcessorOutput]> = new Set()

        await Promise.all(toBuild.values().map(async (handle) => {
            assert(handle.state.status === "building")
            let output: processorStates.ProcessorOutput;
            let fsEntry = fsContent.get(handle.meta.childPath)
            assert(fsEntry !== undefined)

            let content: Buffer | "dir";

            try {
                switch(fsEntry.content[0]) {
                    case "file":
                        content = fsEntry.content[1]
                        break;
                    case "dir":
                        content = "dir"
                }
                output = await handle.processor.build(content)
            } catch(err) {
                const reject = handle.state.reject;
                assert(reject !== undefined)
                handle.state = {
                    status: "error",
                    err
                }

                reject(err)

                err = typeof err === "object" && err !== null && "stack" in err ? err.stack : err
                console.error(`Build failed at ${handle.meta.procName} for ${handle.meta.childPath} because ${err}`)
                return;
            }

            res.add([handle, output])
            const resolve = handle.state.resolve;
            assert(resolve !== undefined)
            handle.state = {
                status: "built",
                processor: handle.processor,
                result: {
                    result: output.result,
                    files: new Set(output.files.keys())
                }
            }
            resolve({
                result: output.result,
                files: new Set(output.files.keys())
            })
        }))

        return res;
    }

    // handles: Map<string, Map<string, ProcessorHandle>>; // wrong
    /*
    handle: ProcessorHandle;

    // ident is the identifier of the processor this is passed to
    // a unique ProcessorHandles is passed to each processor
    constructor([filePath, procIdent]: [string, string], handles: Map<string, Map<string, ProcessorHandle>>) {
        this.handles = handles;
        this.handle = handles.get(filePath)?.get(procIdent)!;
    }
    */

    /*
    async getResult(file: string, processorName: string): Promise<processorStates.ProcessorResult | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        return await fileHandles.get(processorName)?.getResult([file, processorName]);
    }

    async getProcessor(file: string, processorName: string): Promise<Processor | undefined> {
        const fileHandles = this.handles.get(file);
        
        if(fileHandles === undefined || !fileHandles.has(processorName)) {
            return undefined;
        }

        this.handle.dependencies.add([file, processorName]);
        return await fileHandles.get(processorName)?.getProcessor([file, processorName]);
    }
    */
}
