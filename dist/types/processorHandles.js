"use strict";
const assert = require("assert");
const fsEntries = require("./fsEntries");
module.exports = class ProcessorHandles {
    // [fileName, procName] => proc set
    // static cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> = new Map()
    // id => proc
    // static handlesMap: Map<string, ProcessorHandle> = new Map()
    /*
    static getCache(): Map<string, Map<string, Set<ProcessorHandle>>> {
        return this.cachedProcessors
    }

    static setCache(value: Map<string, Map<string, Set<ProcessorHandle>>>): void {
        this.cachedProcessors = value
    }
    */
    static async buildOutputAll(buildInstance) {
        let toBuild = new Set();
        for (const proc of buildInstance.getProcById().values()) {
            if (proc.state.status !== "empty") {
                continue;
            }
            const { promise, resolve, reject } = proc.pendingResultPromise();
            proc.state = {
                status: "building",
                pendingResult: promise,
                reject,
                resolve
            };
            toBuild.add(proc);
        }
        let res = new Set();
        let fsContent = buildInstance.getFsContent();
        await Promise.all(toBuild.values().map(async (handle) => {
            assert(handle.state.status === "building");
            let output;
            let fsEntry = fsContent.get(handle.meta.childPath);
            assert(fsEntry !== undefined);
            let content;
            try {
                switch (fsEntry.content[0]) {
                    case "file":
                        content = fsEntry.content[1];
                        break;
                    case "dir":
                        content = "dir";
                }
                output = await handle.processor.build(content);
            }
            catch (err) {
                const reject = handle.state.reject;
                assert(reject !== undefined);
                handle.state = {
                    status: "error",
                    err
                };
                reject(err);
                err = typeof err === "object" && err !== null && "stack" in err ? err.stack : err;
                console.error(`Build failed at ${handle.meta.procName} for ${handle.meta.childPath} because ${err}`);
                return;
            }
            res.add([handle, output]);
            const resolve = handle.state.resolve;
            assert(resolve !== undefined);
            handle.state = {
                status: "built",
                processor: handle.processor,
                result: {
                    result: output.result,
                    files: new Set(output.files.keys())
                }
            };
            resolve({
                result: output.result,
                files: new Set(output.files.keys())
            });
        }));
        return res;
    }
};
//# sourceMappingURL=processorHandles.js.map