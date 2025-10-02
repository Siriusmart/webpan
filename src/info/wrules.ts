import path = require("path");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import assert = require("assert");
import type ruleEntry = require("../types/ruleEntry");
import type writeEntry = require("../types/writeEntry");
import Processor = require("../types/processor");
import micromatch = require("micromatch")
import getProcessor = require("./getProcessor");
import deepEq = require("../utils/deepEq");
import ProcessorHandles = require("../types/processorHandles");
import WriteEntriesManager = require("../info/writeEntriesManager");
import type ProcessorHandle = require("../types/processorHandle");

let cachedRules: Map<string, ruleEntry.RuleEntryNormalised> = new Map();

function normaliseRawProcessor(proc: ruleEntry.ProcessorType): ruleEntry.ProcessorSettings[] {
    switch(typeof proc) {
        case "string":
            return [{ procName: proc, settings: null }];
        case "object":
            if(Array.isArray(proc)) {
                return proc.map(ident => ({ procName: ident, settings: null }))
            } else {
                return Array.from(Object.entries(proc).map(([ident, settings]) => ({ procName: ident, settings })));
            }
    }
}

function rawToNormalised(raw: ruleEntry.RuleEntryRaw): ruleEntry.RuleEntryNormalised {
    if(raw.processors === undefined) {
        raw.processors = new Map();
    }

    return {
        processors: new Map(Object.entries(raw.processors)
                            .map(([fileName, procs]) => [fileName, new Set(normaliseRawProcessor(procs))]))
    }
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

function setCachedRules(rules: Map<string, ruleEntry.RuleEntryNormalised>) {
    cachedRules = rules
}

async function updateRules(root: string, fsEntries: fsEntries.FsContentEntries, writeEntries: WriteEntriesManager, diff: procEntries.DiffEntries<string>): Promise<void> {
    let processors = ProcessorHandles.getCache();

    for(const [filePath, diffType] of diff.entries()) {
        if(path.basename(filePath) !== "wrules.json") {
            continue;
        }

        const rulesDirName = path.join(path.dirname(filePath), "/")

        let previousRules = cachedRules.get(rulesDirName);
        let newRules: ruleEntry.RuleEntryNormalised | undefined;

        switch(diffType) {
            case "removed":
                cachedRules?.delete(rulesDirName)
                newRules = undefined;
                break;
            case "changed":
            case "created":
                let entry = fsEntries.get(filePath);
                assert(entry !== undefined)
                try {
                    assert(entry.content[0] === "file");
                    const rulesRaw = JSON.parse(entry.content[1].toString("utf8")) as ruleEntry.RuleEntryRaw;
                    newRules = rawToNormalised(rulesRaw);

                    assert(cachedRules !== undefined)
                    cachedRules.set(rulesDirName, newRules);
                } catch (e) {
                    if(typeof e === "object" && e !== null && "stack" in e) {
                        e = e.stack
                    }
                    throw new Error(`Failed to read ${filePath} because ${e}.`)
                }
        }


        for(const absFileName of fsEntries.keys()) {
            if(!absFileName.startsWith(rulesDirName) || (diff.has(absFileName) && diff.get(absFileName) !== "changed")) {
                continue
            }

            // console.log(`file=${absFileName} rulesDir=${rulesDirName} diff=${diff.get(absFileName)}`)

            const relFileName = absFileName.substring(rulesDirName.length - 1)

            let removedProcs: Set<ruleEntry.ProcessorSettings> = new Set()

            let fileProcsBefore: Set<ruleEntry.ProcessorSettings> = new Set()
            if(previousRules !== undefined) {
                for(const [pattern, procs] of previousRules.processors.entries()) {
                    if(micromatch.isMatch(relFileName, pattern)) {
                        procs.forEach(setting => fileProcsBefore.add(setting))
                    }
                }
            }

            let fileProcsAfter: Set<ruleEntry.ProcessorSettings> = new Set()
            if(newRules !== undefined) {
                for(const [pattern, procs] of newRules.processors.entries()) {
                    if(micromatch.isMatch(relFileName, pattern)) {
                        procs.forEach(setting => fileProcsAfter.add(setting))
                    }
                }
            }

            // console.log(`file=${absFileName} before=${JSON.stringify(Array.from(fileProcsBefore.values()))} after=${JSON.stringify(Array.from(fileProcsAfter.values()))}`)

            for(const procRule of fileProcsBefore.values()) {
                let matchedProcRule = fileProcsAfter.values().find(procRuleAfter => deepEq(procRule, procRuleAfter))

                if(matchedProcRule === undefined) {
                    removedProcs.add(procRule)
                } else {
                    fileProcsAfter.delete(matchedProcRule)
                }
            }

            let procCache = ProcessorHandles.getCache()
            let fileProcsEditable = procCache.get(absFileName)
            
            if(fileProcsEditable === undefined) {
                fileProcsEditable = new Map()
                procCache.set(absFileName, fileProcsEditable)
            }

            // now removedProcs contains all procs removed
            // and fileProcsAfter contains all added procs
            // console.log(`${absFileName} toAdd=${Array.from(fileProcsAfter)} toRemove=${Array.from(removedProcs)}`)

            nextProc: for(const toRemove of removedProcs) {
                let setWithProcName = fileProcsEditable.get(toRemove.procName) ?? new Set();
                for(const potentialTarget of setWithProcName) {
                    if(potentialTarget.meta.ruleLocation === rulesDirName && deepEq(potentialTarget.meta.settings, toRemove.settings)) {
                        potentialTarget.drop()
                        setWithProcName.delete(potentialTarget)
                        if(setWithProcName.size === 0) {
                            fileProcsEditable.delete(toRemove.procName)
                        }
                        continue nextProc
                    }
                }

                throw new Error(`Cannot find processor ${toRemove} for removal`)
            }

            for(const toAdd of fileProcsAfter.values()) {
                const procClass = await getProcessor(root, toAdd.procName)

                const meta: procEntries.ProcessorMetaEntry = {
                    childPath: absFileName,
                    // fullPath: path.join(root, "src", relFileName),
                    procName: toAdd.procName,
                    relativePath: relFileName,
                    ruleLocation: rulesDirName,
                    settings: toAdd.settings,
                }

                let procObj = new procClass(processors, writeEntries, meta);
                let procNamedSet = fileProcsEditable.get(toAdd.procName)
                if(procNamedSet === undefined) {
                    procNamedSet = new Set()
                    fileProcsEditable.set(toAdd.procName, procNamedSet)
                }

                procNamedSet.add(procObj.handle)
            }

            if(fileProcsEditable.size === 0) {
                procCache.delete(absFileName)
            }
        }

    }
}

function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined {
    return cachedRules?.get(dirName)
}

function getAllRules(): Map<string, ruleEntry.RuleEntryNormalised> {
    return cachedRules
}

interface FoundProcessorEntry {
    processorClass: procEntries.ProcClass,
    settings: any,
    // procDir: string, why is this a thing?
    relativePath: string,
    ruleLocation: string,
    pattern: string,
    procName: string
}

async function resolveProcessors(root: string, dirCursor: string, fileName: string = dirCursor.endsWith("/") ? "/" : ""): Promise<Set<FoundProcessorEntry>> {
    const dirRule = getRule(dirCursor);

    let foundEntries: Set<FoundProcessorEntry> = new Set();

    if(dirRule !== undefined) {
        for(const [pattern, procs] of dirRule.processors.entries()) {
            if(micromatch.isMatch(fileName, pattern)) {
                for(const proc of procs) {
                    foundEntries.add({
                        processorClass: await getProcessor(root, proc.procName),
                        settings: proc.settings,
                        // procDir: path.join(dirCursor, "/"), why is this a thing?
                        relativePath: fileName,
                        ruleLocation: dirCursor,
                        pattern: pattern,
                        procName: proc.procName
                    })
                }
            }
        }
    }

    if(dirCursor !== "/") {
        const parentProcessors = await resolveProcessors(root, path.join(path.dirname(dirCursor), "/"), path.join("/", path.basename(dirCursor), fileName))
        parentProcessors.forEach(foundEntries.add, foundEntries)
    }

    return foundEntries
}

export = {
    // initRules,
    setCachedRules,
    getRule,
    getAllRules,
    updateRules,
    resolveProcessors
}
