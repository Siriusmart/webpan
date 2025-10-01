import assert = require("assert");
import wrules = require("../info/wrules");
import fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import ProcessorHandle = require("../types/processorHandle");
import ProcessorHandles = require("../types/processorHandles");
import processorStates = require("../types/processorStates");
import path = require("path");
import fs = require("fs/promises");
import fsUtils = require("../utils/fsUtils");
import fsContentCache = require("../info/fsContentCache");
import WriteEntriesManager = require("../info/writeEntriesManager")
import buildInfo = require("../info/buildInfo")

let currentlyBuilding: Promise<void> | null = null;
let nextBuilding: [Promise<void>, Map<string, procEntries.DiffType>, fsEntries.HashedEntries] | null = null;

async function buildDiffInternal(root: string, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void> {
    let cachedProcessors = ProcessorHandles.getCache()
    // TODO change to only feed in updated rules files
    
    writeEntries.setState("writable")

    fsContentCache.setFsContentCache(fsContent);
    await wrules.updateRules(root, fsContent, writeEntries, diff)

    // let toBuild: [ProcessorHandle, Buffer | "dir"][] = [];
    let writableBuffer = writeEntries.getBuffer()

    for(const [filePath, diffType] of diff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch(diffType) {
            case "removed":
            case "changed":
                cachedProcessors.get(filePath)?.values()
                    .forEach(handles => handles.forEach(handle => {

                        if(diffType === "changed") {
                            const content = fsContent.get(filePath)?.content;
                            assert(content !== undefined);
                            // toBuild.push([handle, content[0] === "file" ? content[1] : "dir"])
                        }

                        handle.reset()

                        if(diffType === "removed") {
                            handle.drop()
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
                        // pattern: procEntry.pattern,
                        settings: procEntry.settings,
                    }
                    let proc = new procEntry.processorClass(cachedProcessors, writeEntries, meta);

                    if(!cachedProcessors.has(filePath)) {
                        cachedProcessors.set(filePath, new Map())
                    }

                    if(!cachedProcessors.get(filePath)?.has(procEntry.procName)) {
                        cachedProcessors.get(filePath)?.set(procEntry.procName, new Set())
                    }

                    cachedProcessors.get(filePath)?.get(procEntry.procName)?.add(proc.handle)


                    const content = fsContent.get(filePath)?.content;
                    assert(content !== undefined);
                    // toBuild.push([proc.handle, content[0] === "file" ? content[1] : "dir"])
                })
                // get processors
                // insert each task into cachedProcessors (flat)
                // add task to toBuild
                // remember to try catch each build so one failed build dont spoil everything
        }
    }

    /*
    for(const [handleToBuild, _] of toBuild.values()) {
        assert(handleToBuild.state.status === "empty")

        const { promise, resolve, reject } = handleToBuild.pendingResultPromise();
        handleToBuild.state = {
            status: "building",
            pendingResult: promise,
            reject,
            resolve
        }
    }
    */

    const res = await ProcessorHandles.buildOutputAll(fsContent)

    /*
    await Promise.all(toBuild.map(async ([handle, content]) => {
        assert(handle.state.status === "building")
        let output: processorStates.ProcessorOutput;
        try {
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
    */

    writeEntries.setState("readonly")
    fsContentCache.clearFsContentCache();

    res.forEach(([handle, output]) => {
        handle.updateWithOutput(output, writableBuffer)
    })

    const writeTasks = Array.from(writableBuffer.entries()).map(async ([childPath, writeEntry]) => {
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
    writeEntries.setState("disabled")

    await buildInfo.writeBuildInfo(root, buildInfo.wrapBuildInfo(hashedEntries, cachedProcessors, wrules.getAllRules()))
}

async function buildDiff(root: string, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void> {
    if(currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(root, writeEntries, fsContent, diff, hashedEntries);
        await currentlyBuilding;
        currentlyBuilding = null;
        return;
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
            currentlyBuilding = buildDiffInternal(root, writeEntries, fsContent, nextBuilding[1], nextBuilding[2]);
            nextBuilding = null;
            await currentlyBuilding;
            currentlyBuilding = null;
            res();
        }), new Map(), hashedEntries];
    } else {
        await nextBuilding[0]
    }
}

export = buildDiff;
