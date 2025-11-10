"use strict";
const cleanBuild = require("../actions/cleanBuild");
const assert = require("assert");
const WriteEntriesManager = require("../info/writeEntriesManager");
const wrules = require("../info/wrules");
const buildInfo = require("../info/buildInfo");
const path = require("path");
class BuildInstance {
    root;
    manifest;
    writeEntries;
    // fs
    fsContent;
    fsHashedEntries;
    fsDiff;
    // processor
    procByFiles;
    procById;
    rules;
    static normaliseOutput(output, meta) {
        output.files = new Map(output.files.entries().map(([filePath, buffer]) => {
            if (!filePath.startsWith('/')) {
                filePath = path.normalize(path.join(meta.ruleLocation, filePath));
            }
            else {
                filePath = path.normalize(filePath);
            }
            return [filePath, buffer];
        }));
    }
    constructor(root, manifest) {
        this.root = root;
        this.manifest = manifest;
        this.writeEntries = new WriteEntriesManager();
        this.fsContent = new Map();
        this.fsHashedEntries = new Map();
        this.fsDiff = new Map();
        this.procByFiles = new Map();
        this.procById = new Map();
        this.rules = new Map();
    }
    withHashedEntries(hashedEntries) {
        this.fsHashedEntries = hashedEntries;
        return this;
    }
    async buildOutputAll() {
        let toBuild = new Set();
        for (const proc of this.getProcById().values()) {
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
        let fsContent = this.getFsContent();
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
            BuildInstance.normaliseOutput(output, handle.meta);
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
    async withFsContent(fsContent, hashedEntries, fsDiff) {
        this.fsContent = fsContent;
        this.fsHashedEntries = hashedEntries;
        this.fsDiff = fsDiff;
        await wrules.updateRules(this);
        return this;
    }
    withProcs(procByFiles, procById) {
        this.procByFiles = procByFiles;
        this.procById = procById;
        return this;
    }
    withRules(rules) {
        this.rules = rules;
        return this;
    }
    withBuildCycleState(buildCycleState) {
        this.writeEntries.setState(buildCycleState);
        switch (buildCycleState) {
            case "readonly":
                this.fsDiff.clear();
                this.fsContent.clear();
                break;
            default: { }
        }
        return this;
    }
    getRoot() {
        return this.root;
    }
    getWriteEntriesManager() {
        return this.writeEntries;
    }
    getFsDiff() {
        return this.fsDiff;
    }
    getFsContent() {
        return this.fsContent;
    }
    getFsHashedEntries() {
        return this.fsHashedEntries;
    }
    getRules() {
        return this.rules;
    }
    getProcByFiles() {
        return this.procByFiles;
    }
    getProcById() {
        return this.procById;
    }
    async clean() {
        await cleanBuild(this.root);
    }
    async writeMeta() {
        await buildInfo.writeBuildInfo(this.root, this.manifest, buildInfo.wrapBuildInfo(this.fsHashedEntries, this.procByFiles, this.rules));
    }
}
module.exports = BuildInstance;
//# sourceMappingURL=buildInstance.js.map