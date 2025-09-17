import path = require("path");
import type fsEntries = require("../types/fsEntries");
import assert = require("assert");
import type ruleEntry = require("../types/ruleEntry");

let cachedRules: Map<string, ruleEntry.RuleEntryNormalised> | undefined = undefined;

function normaliseRawProcessor(proc: ruleEntry.ProcessorType): Map<string, any> {
    switch(typeof proc) {
        case "undefined":
            return new Map();
        case "string":
            return new Map([[proc, {}]]);
        case "object":
            if(Array.isArray(proc)) {
                return new Map(proc.map(ident => [ident, {}]))
            } else {
                return proc;
            }
    }
}

function rawToNormalised(raw: ruleEntry.RuleEntryRaw): ruleEntry.RuleEntryNormalised {
    return {
        processors: new Map((raw.processors ?? new Map())
                            .entries()
                            .map(([fileName, procs]) => [fileName, normaliseRawProcessor(procs)]))
    }
}

function initRules(fsEntries: fsEntries.FsContentEntries) {
    for(const [entryPath, entry] of fsEntries.entries()) {
        if(path.basename(entryPath) !== "vgrules.json") {
            continue;
        }

        try {
            assert(entry.content[0] === "file");
            const rulesRaw = JSON.parse(entry.content[1].toString("utf8")) as ruleEntry.RuleEntryRaw;
            const rulesNormalised = rawToNormalised(rulesRaw);

            assert(cachedRules !== undefined);

            const rulesDirName = path.dirname(entryPath) + "/"
            cachedRules.set(rulesDirName, rulesNormalised);
        } catch (e) {
            throw new Error(`Failed to read ${entryPath} because ${e}.`)
        }
    }
}

function getRule(dirName: string): ruleEntry.RuleEntryNormalised | undefined {
    return cachedRules?.get(dirName)
}

export = {
    initRules,
    getRule
}
