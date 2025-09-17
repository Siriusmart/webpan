"use strict";
const path = require("path");
const assert = require("assert");
let cachedRules = undefined;
function normaliseRawProcessor(proc) {
    switch (typeof proc) {
        case "undefined":
            return new Map();
        case "string":
            return new Map([[proc, {}]]);
        case "object":
            if (Array.isArray(proc)) {
                return new Map(proc.map(ident => [ident, {}]));
            }
            else {
                return proc;
            }
    }
}
function rawToNormalised(raw) {
    return {
        processors: new Map((raw.processors ?? new Map())
            .entries()
            .map(([fileName, procs]) => [fileName, normaliseRawProcessor(procs)]))
    };
}
function initRules(fsEntries) {
    for (const [entryPath, entry] of fsEntries.entries()) {
        if (path.basename(entryPath) !== "vgrules.json") {
            continue;
        }
        try {
            assert(entry.content[0] === "file");
            const rulesRaw = JSON.parse(entry.content[1].toString("utf8"));
            const rulesNormalised = rawToNormalised(rulesRaw);
            assert(cachedRules !== undefined);
            const rulesDirName = path.dirname(entryPath) + "/";
            cachedRules.set(rulesDirName, rulesNormalised);
        }
        catch (e) {
            throw new Error(`Failed to read ${entryPath} because ${e}.`);
        }
    }
}
function getRule(dirName) {
    return cachedRules?.get(dirName);
}
module.exports = {
    initRules,
    getRule
};
//# sourceMappingURL=vgrules.js.map