"use strict";
const assert = require("assert");
const wrules = require("../info/wrules");
const fsEntries = require("../types/fsEntries");
const ProcessorHandle = require("../types/processorHandle");
const ProcessorHandles = require("../types/processorHandles");
const processorStates = require("../types/processorStates");
const path = require("path");
const fs = require("fs/promises");
const fsUtils = require("../utils/fsUtils");
const fsContentCache = require("../info/fsContentCache");
const WriteEntriesManager = require("../info/writeEntriesManager");
const buildInfo = require("../info/buildInfo");
let currentlyBuilding = null;
let nextBuilding = null;
// async function buildDiffInternal(root: string, manifest: wmanifest.WManifest, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void> {
async function buildDiffInternal(buildInstance, fsContent, hashedEntries, fsDiff) {
    // let cachedProcessors = ProcessorHandles.getCache()
    // TODO change to only feed in updated rules files
    await buildInstance.withBuildCycleState("writable")
        .withFsContent(fsContent, hashedEntries, fsDiff);
    // fsContentCache.setFsContentCache(fsContent);
    // await wrules.updateRules(root, fsContent, writeEntries, diff)
    // let toBuild: [ProcessorHandle, Buffer | "dir"][] = [];
    // let writableBuffer = writeEntries.getBuffer()
    let cachedProcessors = buildInstance.getProcByFiles();
    for (const [filePath, diffType] of fsDiff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch (diffType) {
            case "removed":
            case "changed":
                cachedProcessors.get(filePath)?.values()
                    .forEach(handles => handles.forEach(handle => {
                    if (diffType === "changed") {
                        const content = fsContent.get(filePath)?.content;
                        assert(content !== undefined);
                        // toBuild.push([handle, content[0] === "file" ? content[1] : "dir"])
                    }
                    handle.reset();
                    if (diffType === "removed") {
                        handle.drop();
                    }
                }));
                if (diffType === "removed") {
                    cachedProcessors.delete(filePath);
                }
                break;
            case "created":
                const resolvedProcessors = await wrules.resolveProcessors(buildInstance, filePath);
                cachedProcessors.set(filePath, new Map());
                resolvedProcessors.values().forEach(procEntry => {
                    const meta = {
                        childPath: filePath,
                        // fullPath: path.join(root, "src", filePath),
                        procName: procEntry.procName,
                        relativePath: procEntry.relativePath,
                        ruleLocation: procEntry.ruleLocation,
                        // pattern: procEntry.pattern,
                        settings: procEntry.settings,
                    };
                    let proc = new procEntry.processorClass(buildInstance, meta);
                    if (!cachedProcessors.has(filePath)) {
                        cachedProcessors.set(filePath, new Map());
                    }
                    if (!cachedProcessors.get(filePath)?.has(procEntry.procName)) {
                        cachedProcessors.get(filePath)?.set(procEntry.procName, new Set());
                    }
                    cachedProcessors.get(filePath)?.get(procEntry.procName)?.add(proc.handle);
                    const content = fsContent.get(filePath)?.content;
                    assert(content !== undefined);
                    // toBuild.push([proc.handle, content[0] === "file" ? content[1] : "dir"])
                });
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
    const res = await ProcessorHandles.buildOutputAll(buildInstance);
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
    buildInstance.withBuildCycleState("readonly");
    res.forEach(([handle, output]) => {
        handle.updateWithOutput(output, buildInstance.getWriteEntriesManager().getBuffer());
    });
    const writeTasks = Array.from(buildInstance.getWriteEntriesManager().getBuffer().entries()).map(async ([childPath, writeEntry]) => {
        try {
            const fullPath = path.join(buildInstance.getRoot(), "dist", childPath);
            if (writeEntry.content == "remove") {
                await fs.unlink(fullPath);
            }
            else {
                await fsUtils.writeCreate(fullPath, writeEntry.content);
            }
        }
        catch (e) {
            if (typeof e === "object" && e !== null && "stack" in e) {
                e = e.stack;
            }
            throw new Error(`An error occured when writing changes to ${childPath} because ${e}`);
        }
    });
    await Promise.all(writeTasks);
    buildInstance.withBuildCycleState("disabled");
    await buildInstance.writeMeta();
}
// async function buildDiff(root: string, manifest: wmanifest.WManifest, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void> {
async function buildDiff(buildInstance, fsContent, diff, hashedEntries) {
    if (currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(buildInstance, fsContent, hashedEntries, diff);
        await currentlyBuilding;
        currentlyBuilding = null;
        return;
    }
    if (nextBuilding === null) {
        nextBuilding = [new Promise(async (res) => {
                assert(nextBuilding !== null);
                for (const [entryPath, entryDiff] of diff.entries()) {
                    switch (entryDiff) {
                        case "changed":
                        case "removed":
                            nextBuilding[1].set(entryPath, entryDiff);
                            break;
                        case "created":
                            if (nextBuilding[1].has(entryPath)) {
                                nextBuilding[1].set(entryPath, "changed");
                            }
                            else {
                                nextBuilding[1].set(entryPath, entryDiff);
                            }
                            break;
                    }
                }
                await currentlyBuilding;
                currentlyBuilding = buildDiffInternal(buildInstance, nextBuilding[3], nextBuilding[2], nextBuilding[1]);
                nextBuilding = null;
                await currentlyBuilding;
                currentlyBuilding = null;
                res();
            }), new Map(), hashedEntries, fsContent];
    }
    else {
        await nextBuilding[0];
    }
}
module.exports = buildDiff;
//# sourceMappingURL=buildDiff.js.map