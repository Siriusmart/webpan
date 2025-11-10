import cleanBuild = require("../actions/cleanBuild");
import assert = require("assert");

import type wmanifest = require("../types/wmanifest");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type writeEntry = require("../types/writeEntry");
import type ruleEntry = require("../types/ruleEntry");
import type processorStates = require("../types/processorStates");
import type ProcessorHandle = require("../types/processorHandle");

import WriteEntriesManager = require("../info/writeEntriesManager");
import wrules = require("../info/wrules");
import buildInfo = require("../info/buildInfo");
import path = require("path");

class BuildInstance {
    private root: string;
    private manifest: wmanifest.WManifest;
    private writeEntries: WriteEntriesManager;

    // fs
    private fsContent: fsEntries.FsContentEntries;
    private fsHashedEntries: fsEntries.HashedEntries;
    private fsDiff: procEntries.DiffEntries<string>;

    // processor
    private procByFiles: procEntries.ProcByFileMap
    private procById: procEntries.ProcByIdMap;
    private rules: ruleEntry.RuleEntries

    static normaliseOutput(output: processorStates.ProcessorOutput, meta: procEntries.ProcessorMetaEntry) {
        output.files = new Map(output.files.entries().map(([filePath, buffer]) => {
            if(!filePath.startsWith('/')) {
                filePath = path.normalize(path.join(meta.ruleLocation, filePath))
            } else {
                filePath = path.normalize(filePath)
            }

            return [filePath, buffer]
        }))
    }


    constructor(root: string, manifest: wmanifest.WManifest) {
        this.root = root;
        this.manifest = manifest;
        this.writeEntries = new WriteEntriesManager()

        this.fsContent = new Map()
        this.fsHashedEntries = new Map()
        this.fsDiff = new Map()

        this.procByFiles = new Map()
        this.procById = new Map()
        this.rules = new Map()
    }

    withHashedEntries(hashedEntries: fsEntries.HashedEntries): BuildInstance {
        this.fsHashedEntries = hashedEntries;
        return this;
    }

    async buildOutputAll(): Promise<Set<[ProcessorHandle, processorStates.ProcessorOutput]>> {
        let toBuild: Set<ProcessorHandle> = new Set()

        for(const proc of this.getProcById().values()) {
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
        let fsContent = this.getFsContent()

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

            BuildInstance.normaliseOutput(output, handle.meta)

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

    async withFsContent(fsContent: fsEntries.FsContentEntries, hashedEntries: fsEntries.HashedEntries, fsDiff: procEntries.DiffEntries<string>): Promise<BuildInstance>{
        this.fsContent = fsContent;
        this.fsHashedEntries = hashedEntries
        this.fsDiff = fsDiff

        await wrules.updateRules(this)
        
        return this
    }

    withProcs(procByFiles: procEntries.ProcByFileMap, procById: procEntries.ProcByIdMap): BuildInstance {
        this.procByFiles = procByFiles
        this.procById = procById
        return this
    }

    withRules(rules: ruleEntry.RuleEntries): BuildInstance {
        this.rules = rules;
        return this
    }

    withBuildCycleState(buildCycleState: writeEntry.WriteEntryManagerState): BuildInstance {
        this.writeEntries.setState(buildCycleState)

        switch(buildCycleState) {
            case "readonly":
                this.fsDiff.clear()
                this.fsContent.clear()
                break;
            default: {}
        }

        return this
    }

    getRoot(): string {
        return this.root
    }

    getWriteEntriesManager(): WriteEntriesManager {
        return this.writeEntries
    }

    getFsDiff(): procEntries.DiffEntries<string> {
        return this.fsDiff
    }

    getFsContent(): fsEntries.FsContentEntries {
        return this.fsContent
    }

    getFsHashedEntries(): fsEntries.HashedEntries {
        return this.fsHashedEntries
    }

    getRules(): ruleEntry.RuleEntries {
        return this.rules
    }

    getProcByFiles(): procEntries.ProcByFileMap {
        return this.procByFiles
    }

    getProcById(): procEntries.ProcByIdMap {
        return this.procById
    }

    async clean(): Promise<void> {
        await cleanBuild(this.root)
    }

    async writeMeta(): Promise<void> {
        await buildInfo.writeBuildInfo(this.root, this.manifest, buildInfo.wrapBuildInfo(this.fsHashedEntries, this.procByFiles, this.rules))
    }
}

export = BuildInstance
