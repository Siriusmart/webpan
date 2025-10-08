import micromatch = require("micromatch");

import type BuildInstance = require("./buildInstance");
import type procEntries = require("./procEntries");
import type processorStates = require("./processorStates");

import ProcessorHandle = require("./processorHandle");
import path = require("path");

class FileNamedProcOne {
    private parent: ProcessorHandle;
    private proc: ProcessorHandle;

    constructor(parent: ProcessorHandle, proc: ProcessorHandle) {
        this.parent = parent;
        this.proc = proc;
    }

    public async getResult(): Promise<processorStates.ProcessorResult> {
        return await this.proc.getResult(this.parent)
    }

    public async getProcessor(): Promise<Processor> {
        return await this.proc.getProcessor(this.parent)
    }
}

class FileNamedProcs {
    private parent: ProcessorHandle;
    private procsSet: Set<ProcessorHandle>;

    constructor(parent: ProcessorHandle, procsSet: Set<ProcessorHandle>) {
        this.parent = parent;
        this.procsSet = procsSet;
    }

    public values(): IteratorObject<FileNamedProcOne> {
        return this.procsSet.values().map(proc => new FileNamedProcOne(this.parent, proc))
    }

    public toSet(): Set<FileNamedProcOne> {
        return new Set(this.values())
    }
}

class FileProcs {
    private parent: ProcessorHandle;
    private procsMap: Map<string, Set<ProcessorHandle>>;

    constructor(parent: ProcessorHandle, procsMap: Map<string, Set<ProcessorHandle>>) {
        this.parent = parent;
        this.procsMap = procsMap;
    }

    public procs(options: { pattern?: string } = {}): Map<string, FileNamedProcs> {
        let out: Map<string, FileNamedProcs> = new Map();

        for(const [name, fileNamedProcs] of this.procsMap.entries()) {
            if(options.pattern === undefined || micromatch.isMatch(name, options.pattern)) {
                out.set(name, new FileNamedProcs(this.parent, fileNamedProcs))
            }
        }

        return out;
    }
}

abstract class Processor {
    __handle: ProcessorHandle;
    private buildInstance: BuildInstance;

    constructor(buildInstance: BuildInstance, meta: procEntries.ProcessorMetaEntry, id?: string) {
        this.buildInstance = buildInstance
        this.__handle = new ProcessorHandle(buildInstance, meta, this, id);
    }

    public files(options: { pattern?: string, absolute?: boolean } = {}): Map<string, FileProcs> {
        let dirPath = this.__handle.meta.childPath;

        if(options.absolute !== true && !dirPath.endsWith('/')) {
            dirPath = path.join(path.dirname(dirPath), "/")
        }

        let out: Map<string, FileProcs> = new Map();

        for(const [absPath, procsMap] of this.buildInstance.getProcByFiles().entries()) {
            let relPath;
            
            if(options.absolute ?? false) {
                relPath = absPath;
            } else {
                if(!absPath.startsWith(dirPath)) {
                    continue
                }

                relPath = absPath.substring(dirPath.length - 1)
            }

            if(options.pattern === undefined || micromatch.isMatch(relPath, options.pattern)) {
                out.set(relPath, new FileProcs(this.__handle, procsMap))
            }
        }

        return out;
    }

    abstract build(content: Buffer | "dir"): Promise<processorStates.ProcessorOutput>;
}

export = Processor
