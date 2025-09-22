"use strict";
const assert = require("assert");
const wrules = require("../info/wrules");
const ProcessorHandle = require("../types/processorHandle");
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
                        toBuild.push((async () => [handle, await handle.processor.build(content[0] === "file" ? content[1] : "dir")])());
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
                        settings: procEntry.settings
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
                    toBuild.push((async () => [proc.handle, await proc.build(content[0] === "file" ? content[1] : "dir")])());
                });
            // get processors
            // insert each task into cachedProcessors (flat)
            // add task to toBuild
            // remember to try catch each build so one failed build dont spoil everything
        }
    }
    const res = await Promise.all(toBuild);
    fsContentCache.clearFsContentCache();
    res.forEach(([handle, output]) => {
        const previousOutput = "result" in handle.state ? handle.state.result.files : new Set();
        const previousOutputMap = new Map(Array.from(previousOutput).map(filePath => [filePath, null]));
        const outputDiff = calcDiff.calcDiff(previousOutputMap, output.files);
        for (let [filePath, difftype] of outputDiff.entries()) {
            if (!filePath.startsWith('/')) {
                filePath = path.join(handle.meta.childPath, filePath);
            }
            filePath = path.normalize(filePath);
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
            const fullPath = path.join(root, childPath);
            if (writeEntry.content == "remove") {
                await fs.unlink(fullPath);
            }
            else {
                await fsUtils.writeCreate(fullPath, writeEntry.content);
            }
        }
        catch (e) {
            console.error(`An error occured when writing changes to ${childPath} because ${e}`);
        }
    });
    await Promise.all(writeTasks);
}
async function buildDiff(root, fsContent, diff) {
    if (currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(root, fsContent, diff);
        return await currentlyBuilding;
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