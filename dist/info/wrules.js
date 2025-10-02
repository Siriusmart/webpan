"use strict";
const path = require("path");
const assert = require("assert");
const Processor = require("../types/processor");
const micromatch = require("micromatch");
const getProcessor = require("./getProcessor");
const deepEq = require("../utils/deepEq");
const ProcessorHandles = require("../types/processorHandles");
const WriteEntriesManager = require("../info/writeEntriesManager");
let cachedRules = new Map();
function normaliseRawProcessor(proc) {
    switch (typeof proc) {
        case "string":
            return [{ procName: proc, settings: null }];
        case "object":
            if (Array.isArray(proc)) {
                return proc.map(ident => ({ procName: ident, settings: null }));
            }
            else {
                return Array.from(Object.entries(proc).map(([ident, settings]) => ({ procName: ident, settings })));
            }
    }
}
function rawToNormalised(raw) {
    if (raw.processors === undefined) {
        raw.processors = new Map();
    }
    return {
        processors: new Map(Object.entries(raw.processors)
            .map(([fileName, procs]) => [fileName, new Set(normaliseRawProcessor(procs))]))
    };
}
/*
function initRules(fsEntries: fsEntries.FsContentEntries) {
    for(const [entryPath, entry] of fsEntries.entries()) {
        if(path.basename(entryPath) !== "wrules.json") {
            continue;
        }

        try {
            assert(entry.content[0] === "file");
            const rulesRaw = JSON.parse(entry.content[1].toString("utf8")) as ruleEntry.RuleEntryRaw;
            const rulesNormalised = rawToNormalised(rulesRaw);

            cachedRules ??= new Map();

            const rulesDirName = path.join(path.dirname(entryPath), "/")
            cachedRules.set(rulesDirName, rulesNormalised);
        } catch (e) {
            if(typeof e === "object" && e !== null && "stack" in e) {
                e = e.stack
            }
            throw new Error(`Failed to read ${entryPath} because ${e}.`)
        }
    }
}
*/
function setCachedRules(rules) {
    cachedRules = rules;
}
async function updateRules(root, fsEntries, writeEntries, diff) {
    let processors = ProcessorHandles.getCache();
    for (const [filePath, diffType] of diff.entries()) {
        if (path.basename(filePath) !== "wrules.json") {
            continue;
        }
        const rulesDirName = path.join(path.dirname(filePath), "/");
        let previousRules = cachedRules.get(rulesDirName);
        let newRules;
        switch (diffType) {
            case "removed":
                cachedRules?.delete(rulesDirName);
                newRules = undefined;
                break;
            case "changed":
            case "created":
                let entry = fsEntries.get(filePath);
                assert(entry !== undefined);
                try {
                    assert(entry.content[0] === "file");
                    const rulesRaw = JSON.parse(entry.content[1].toString("utf8"));
                    newRules = rawToNormalised(rulesRaw);
                    assert(cachedRules !== undefined);
                    cachedRules.set(rulesDirName, newRules);
                }
                catch (e) {
                    if (typeof e === "object" && e !== null && "stack" in e) {
                        e = e.stack;
                    }
                    throw new Error(`Failed to read ${filePath} because ${e}.`);
                }
        }
        for (const absFileName of fsEntries.keys()) {
            if (!absFileName.startsWith(rulesDirName) || (diff.has(absFileName) && diff.get(absFileName) !== "changed")) {
                continue;
            }
            // console.log(`file=${absFileName} rulesDir=${rulesDirName} diff=${diff.get(absFileName)}`)
            const relFileName = absFileName.substring(rulesDirName.length - 1);
            let removedProcs = new Set();
            let fileProcsBefore = new Set();
            if (previousRules !== undefined) {
                for (const [pattern, procs] of previousRules.processors.entries()) {
                    if (micromatch.isMatch(relFileName, pattern)) {
                        procs.forEach(setting => fileProcsBefore.add(setting));
                    }
                }
            }
            let fileProcsAfter = new Set();
            if (newRules !== undefined) {
                for (const [pattern, procs] of newRules.processors.entries()) {
                    if (micromatch.isMatch(relFileName, pattern)) {
                        procs.forEach(setting => fileProcsAfter.add(setting));
                    }
                }
            }
            // console.log(`file=${absFileName} before=${JSON.stringify(Array.from(fileProcsBefore.values()))} after=${JSON.stringify(Array.from(fileProcsAfter.values()))}`)
            for (const procRule of fileProcsBefore.values()) {
                let matchedProcRule = fileProcsAfter.values().find(procRuleAfter => deepEq(procRule, procRuleAfter));
                if (matchedProcRule === undefined) {
                    removedProcs.add(procRule);
                }
                else {
                    fileProcsAfter.delete(matchedProcRule);
                }
            }
            let procCache = ProcessorHandles.getCache();
            let fileProcsEditable = procCache.get(absFileName);
            if (fileProcsEditable === undefined) {
                fileProcsEditable = new Map();
                procCache.set(absFileName, fileProcsEditable);
            }
            // now removedProcs contains all procs removed
            // and fileProcsAfter contains all added procs
            // console.log(`${absFileName} toAdd=${Array.from(fileProcsAfter)} toRemove=${Array.from(removedProcs)}`)
            nextProc: for (const toRemove of removedProcs) {
                let setWithProcName = fileProcsEditable.get(toRemove.procName) ?? new Set();
                for (const potentialTarget of setWithProcName) {
                    if (potentialTarget.meta.ruleLocation === rulesDirName && deepEq(potentialTarget.meta.settings, toRemove.settings)) {
                        potentialTarget.drop();
                        setWithProcName.delete(potentialTarget);
                        if (setWithProcName.size === 0) {
                            fileProcsEditable.delete(toRemove.procName);
                        }
                        continue nextProc;
                    }
                }
                throw new Error(`Cannot find processor ${toRemove} for removal`);
            }
            for (const toAdd of fileProcsAfter.values()) {
                const procClass = await getProcessor(root, toAdd.procName);
                const meta = {
                    childPath: absFileName,
                    // fullPath: path.join(root, "src", relFileName),
                    procName: toAdd.procName,
                    relativePath: relFileName,
                    ruleLocation: rulesDirName,
                    settings: toAdd.settings,
                };
                let procObj = new procClass(processors, writeEntries, meta);
                let procNamedSet = fileProcsEditable.get(toAdd.procName);
                if (procNamedSet === undefined) {
                    procNamedSet = new Set();
                    fileProcsEditable.set(toAdd.procName, procNamedSet);
                }
                procNamedSet.add(procObj.handle);
            }
            if (fileProcsEditable.size === 0) {
                procCache.delete(absFileName);
            }
        }
    }
}
function getRule(dirName) {
    return cachedRules?.get(dirName);
}
function getAllRules() {
    return cachedRules;
}
async function resolveProcessors(root, dirCursor, fileName = dirCursor.endsWith("/") ? "/" : "") {
    const dirRule = getRule(dirCursor);
    let foundEntries = new Set();
    if (dirRule !== undefined) {
        for (const [pattern, procs] of dirRule.processors.entries()) {
            if (micromatch.isMatch(fileName, pattern)) {
                for (const proc of procs) {
                    foundEntries.add({
                        processorClass: await getProcessor(root, proc.procName),
                        settings: proc.settings,
                        // procDir: path.join(dirCursor, "/"), why is this a thing?
                        relativePath: fileName,
                        ruleLocation: dirCursor,
                        pattern: pattern,
                        procName: proc.procName
                    });
                }
            }
        }
    }
    if (dirCursor !== "/") {
        const parentProcessors = await resolveProcessors(root, path.join(path.dirname(dirCursor), "/"), path.join("/", path.basename(dirCursor), fileName));
        parentProcessors.forEach(foundEntries.add, foundEntries);
    }
    return foundEntries;
}
module.exports = {
    // initRules,
    setCachedRules,
    getRule,
    getAllRules,
    updateRules,
    resolveProcessors
};
//# sourceMappingURL=wrules.js.map