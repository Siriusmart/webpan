import path = require("path");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import assert = require("assert");
import type ruleEntry = require("../types/ruleEntry");
import Processor = require("../types/processor");
import micromatch = require("micromatch")
import getProcessor = require("./getProcessor");
import ProcessorHandle = require("../types/processorHandle");

let cachedRules: Map<string, ruleEntry.RuleEntryNormalised> | undefined = undefined;

function normaliseRawProcessor(proc: ruleEntry.ProcessorType): ruleEntry.ProcessorSettings[] {
    switch(typeof proc) {
        case "string":
            return [{ procName: proc, settings: new Map() }];
        case "object":
            if(Array.isArray(proc)) {
                return proc.map(ident => ({ procName: ident, settings: new Map() }))
            } else {
                return Array.from(proc.entries().map(([ident, settings]) => ({ procName: ident, settings })));
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

function initRules(fsEntries: fsEntries.FsContentEntries) {
    for(const [entryPath, entry] of fsEntries.entries()) {
        if(path.basename(entryPath) !== "wrules.json") {
            continue;
        }

        try {
            assert(entry.content[0] === "file");
            const rulesRaw = JSON.parse(entry.content[1].toString("utf8")) as ruleEntry.RuleEntryRaw;
            const rulesNormalised = rawToNormalised(rulesRaw);

            cachedRules = new Map();

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

function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined {
    return cachedRules?.get(dirName)
}

interface FoundProcessorEntry {
    processorClass: { new(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry): Processor }
    settings: Map<string, any>,
    procDir: string,
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
                        procDir: path.join(dirCursor, "/"),
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
        const parentProcessors = await resolveProcessors(root, path.join(path.dirname(dirCursor), "/"), path.join(path.basename(dirCursor), fileName))
        parentProcessors.forEach(foundEntries.add, foundEntries)
    }

    return foundEntries
}

export = {
    initRules,
    getRule,
    resolveProcessors
}
