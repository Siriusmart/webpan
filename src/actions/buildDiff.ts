import assert = require("assert");
import wrules = require("../info/wrules");
import fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import ProcessorHandle = require("../types/processorHandle");
import type processorStates = require("../types/processorStates");
import calcDiff = require("../utils/calcDiff");
import path = require("path");
import fs = require("fs/promises");
import fsUtils = require("../utils/fsUtils");
import Processor = require("../types/processor");
import fsContentCache = require("../info/fsContentCache");

let cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> = new Map();

let currentlyBuilding: Promise<void> | null = null;
let nextBuilding: [Promise<void>, Map<string, procEntries.DiffType>] | null = null;

interface WriteEntry {
    processor: Processor,
    content: Buffer | "remove"
}

async function buildDiffInternal(root: string, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>): Promise<void> {
    // TODO change to only feed in updated rules files
    wrules.initRules(fsContent);

    fsContentCache.setFsContentCache(fsContent);

    let toBuild: Promise<[ProcessorHandle, processorStates.ProcessorOutput]>[] = [];
    let writeEntries: Map<string, WriteEntry> = new Map();

    for(const [filePath, diffType] of diff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch(diffType) {
            case "removed":
            case "changed":
                cachedProcessors.get(filePath)?.values()
                    .forEach(handles => handles.forEach(handle => {

                        if("result" in handle.state) {
                            handle.state.result.files.forEach(toDelete => writeEntries.set(toDelete, { processor: handle.processor, content: "remove"}))
                        }
                        handle.reset()

                        if(diffType === "changed") {
                            const content = fsContent.get(filePath)?.content;
                            assert(content !== undefined);
                            toBuild.push((async() => [handle, await handle.processor.build(content[0] === "file" ? content[1] : "dir")])())
                        }
                    }))

                if(diffType === "removed") {
                    cachedProcessors.delete(filePath)
                }
                break;
            case "created":
                const resolvedProcessors = await wrules.resolveProcessors(root, filePath);
                cachedProcessors.set(filePath, new Map())

                resolvedProcessors.values().forEach(procEntry => {
                    const meta: procEntries.ProcessorMetaEntry = {
                        childPath: filePath,
                        fullPath: path.join(root, "src", filePath),
                        procName: procEntry.procName,
                        relativePath: procEntry.relativePath,
                        ruleLocation: procEntry.ruleLocation,
                        pattern: procEntry.pattern,
                        settings: procEntry.settings,
                    }
                    let proc = new procEntry.processorClass(cachedProcessors, meta);

                    if(!cachedProcessors.has(filePath)) {
                        cachedProcessors.set(filePath, new Map())
                    }

                    if(!cachedProcessors.get(filePath)?.has(procEntry.procName)) {
                        cachedProcessors.get(filePath)?.set(procEntry.procName, new Set())
                    }

                    cachedProcessors.get(filePath)?.get(procEntry.procName)?.add(proc.handle)


                    const content = fsContent.get(filePath)?.content;
                    assert(content !== undefined);
                    toBuild.push((async() => [proc.handle, await proc.build(content[0] === "file" ? content[1] : "dir")])())
                })
                // get processors
                // insert each task into cachedProcessors (flat)
                // add task to toBuild
                // remember to try catch each build so one failed build dont spoil everything
        }
    }

    const res = await Promise.all(toBuild)

    fsContentCache.clearFsContentCache();

    res.forEach(([handle, output]) => {
        const previousOutput: Set<string> = "result" in handle.state ? handle.state.result.files : new Set();
        const previousOutputMap: Map<string, any> = new Map(Array.from(previousOutput).map(filePath => [filePath, null]));
        const outputDiff = calcDiff.calcDiff(previousOutputMap, output.files)

        for(let [filePath, difftype] of outputDiff.entries()) {
            if(!filePath.startsWith('/')) {
                filePath = path.join(handle.meta.childPath, filePath)
            }
            filePath = path.normalize(filePath);
            if(writeEntries.has(filePath)) {
                console.warn(`${handle.getIdent().join('.')} is trying to write to ${filePath}, but it is already modified by ${writeEntries.get(filePath)}!`)
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

            const writeEntry: WriteEntry = {
                content,
                processor: handle.processor
            }
            writeEntries.set(filePath, writeEntry);
        }
    })

    const writeTasks = Array.from(writeEntries.entries()).map(async ([childPath, writeEntry]) => {
        try {
            const fullPath = path.join(root, "dist", childPath);
            if(writeEntry.content == "remove") {
                await fs.unlink(fullPath)
            } else {
                await fsUtils.writeCreate(fullPath, writeEntry.content)
            }
        } catch (e) {
            if(typeof e === "object" && e !== null && "stack" in e) {
                e = e.stack
            }
            throw new Error(`An error occured when writing changes to ${childPath} because ${e}`)
        }
    })

    await Promise.all(writeTasks)
}

async function buildDiff(root: string, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>): Promise<void> {
    if(currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(root, fsContent, diff);
        return await currentlyBuilding;
    }

    if(nextBuilding === null) {
        nextBuilding = [new Promise(async res => {
            assert(nextBuilding !== null)

            for(const [entryPath, entryDiff] of diff.entries()) {
                switch(entryDiff) {
                    case "changed":
                        case "removed":
                        nextBuilding[1].set(entryPath, entryDiff);
                    break;
                    case "created":
                        if(nextBuilding[1].has(entryPath)) {
                        nextBuilding[1].set(entryPath, "changed");
                    } else {
                        nextBuilding[1].set(entryPath, entryDiff);
                    }
                    break;
                }
            }

            await currentlyBuilding;
            currentlyBuilding = buildDiffInternal(root, fsContent, nextBuilding[1]);
            nextBuilding = null;
            await currentlyBuilding;
            currentlyBuilding = null;
            res();
        }), new Map()];
    } else {
        await nextBuilding[0]
    }
}

export = buildDiff;
