"use strict";
const assert = require("assert");
const wrules = require("../info/wrules");
const fsEntries = require("../types/fsEntries");
const ProcessorHandle = require("../types/processorHandle");
const processorStates = require("../types/processorStates");
const calcDiff = require("../utils/calcDiff");
const path = require("path");
const fs = require("fs/promises");
const fsUtils = require("../utils/fsUtils");
const Processor = require("../types/processor");
const fsContentCache = require("../info/fsContentCache");
let cachedProcessors = new Map();
let currentlyBuilding = null;
let nextBuilding = null;
async function buildDiffInternal(root, fsContent, diff) {
    // TODO change to only feed in updated rules files
    wrules.initRules(fsContent);
    fsContentCache.setFsContentCache(fsContent);
    let toBuild = [];
    let writeEntries = new Map();
    for (const [filePath, diffType] of diff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch (diffType) {
            case "removed":
            case "changed":
                cachedProcessors.get(filePath)?.values()
                    .forEach(handles => handles.forEach(handle => {
                    if ("result" in handle.state) {
                        handle.state.result.files.forEach(toDelete => writeEntries.set(toDelete, { processor: handle.processor, content: "remove" }));
                    }
                    handle.reset();
                    if (diffType === "changed") {
                        const content = fsContent.get(filePath)?.content;
                        assert(content !== undefined);
                        toBuild.push([handle, content[0] === "file" ? content[1] : "dir"]);
                    }
                }));
                if (diffType === "removed") {
                    cachedProcessors.delete(filePath);
                }
                break;
            case "created":
                const resolvedProcessors = await wrules.resolveProcessors(root, filePath);
                cachedProcessors.set(filePath, new Map());
                resolvedProcessors.values().forEach(procEntry => {
                    const meta = {
                        childPath: filePath,
                        fullPath: path.join(root, "src", filePath),
                        procName: procEntry.procName,
                        relativePath: procEntry.relativePath,
                        ruleLocation: procEntry.ruleLocation,
                        pattern: procEntry.pattern,
                        settings: procEntry.settings,
                    };
                    let proc = new procEntry.processorClass(cachedProcessors, meta);
                    if (!cachedProcessors.has(filePath)) {
                        cachedProcessors.set(filePath, new Map());
                    }
                    if (!cachedProcessors.get(filePath)?.has(procEntry.procName)) {
                        cachedProcessors.get(filePath)?.set(procEntry.procName, new Set());
                    }
                    cachedProcessors.get(filePath)?.get(procEntry.procName)?.add(proc.handle);
                    const content = fsContent.get(filePath)?.content;
                    assert(content !== undefined);
                    toBuild.push([proc.handle, content[0] === "file" ? content[1] : "dir"]);
                });
            // get processors
            // insert each task into cachedProcessors (flat)
            // add task to toBuild
            // remember to try catch each build so one failed build dont spoil everything
        }
    }
    for (const [handleToBuild, _] of toBuild.values()) {
        assert(handleToBuild.state.status === "empty");
        handleToBuild.state = {
            status: "building",
            pendingResult: handleToBuild.state.pendingResult,
            resolve: handleToBuild.state.resolve,
            reject: handleToBuild.state.reject,
        };
    }
    const res = new Set();
    await Promise.all(toBuild.map(async ([handle, content]) => {
        assert(handle.state.status === "building");
        let output;
        try {
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
            return null;
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
    fsContentCache.clearFsContentCache();
    res.forEach(([handle, output]) => {
        const previousOutput = "result" in handle.state ? handle.state.result.files : new Set();
        const previousOutputMap = new Map(Array.from(previousOutput).map(filePath => [filePath, null]));
        const outputDiff = calcDiff.calcDiff(previousOutputMap, output.files);
        for (let [filePath, difftype] of outputDiff.entries()) {
            if (writeEntries.has(filePath)) {
                console.warn(`${handle.getIdent().join('.')} is trying to write to ${filePath}, but it is already modified by ${writeEntries.get(filePath)}!`);
            }
            let content;
            switch (difftype) {
                case "changed":
                case "created":
                    content = output.files.get(filePath);
                    break;
                case "removed":
                    if (writeEntries.has(filePath)) {
                        continue;
                    }
                    content = "remove";
            }
            const writeEntry = {
                content,
                processor: handle.processor
            };
            writeEntries.set(filePath, writeEntry);
        }
    });
    const writeTasks = Array.from(writeEntries.entries()).map(async ([childPath, writeEntry]) => {
        try {
            const fullPath = path.join(root, "dist", childPath);
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
}
async function buildDiff(root, fsContent, diff) {
    if (currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(root, fsContent, diff);
        await currentlyBuilding;
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
                currentlyBuilding = buildDiffInternal(root, fsContent, nextBuilding[1]);
                nextBuilding = null;
                await currentlyBuilding;
                currentlyBuilding = null;
                res();
            }), new Map()];
    }
    else {
        await nextBuilding[0];
    }
}
module.exports = buildDiff;
//# sourceMappingURL=buildDiff.js.map