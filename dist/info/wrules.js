"use strict";
const path = require("path");
const assert = require("assert");
const Processor = require("../types/processor");
const micromatch = require("micromatch");
const getProcessor = require("./getProcessor");
const ProcessorHandle = require("../types/processorHandle");
let cachedRules = undefined;
function normaliseRawProcessor(proc) {
    switch (typeof proc) {
        case "string":
            return [{ procName: proc, settings: new Map() }];
        case "object":
            if (Array.isArray(proc)) {
                return proc.map(ident => ({ procName: ident, settings: new Map() }));
            }
            else {
                return Array.from(proc.entries().map(([ident, settings]) => ({ procName: ident, settings })));
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
function initRules(fsEntries) {
    for (const [entryPath, entry] of fsEntries.entries()) {
        if (path.basename(entryPath) !== "wrules.json") {
            continue;
        }
        try {
            assert(entry.content[0] === "file");
            const rulesRaw = JSON.parse(entry.content[1].toString("utf8"));
            const rulesNormalised = rawToNormalised(rulesRaw);
            cachedRules = new Map();
            const rulesDirName = path.join(path.dirname(entryPath), "/");
            cachedRules.set(rulesDirName, rulesNormalised);
        }
        catch (e) {
            if (typeof e === "object" && e !== null && "stack" in e) {
                e = e.stack;
            }
            throw new Error(`Failed to read ${entryPath} because ${e}.`);
        }
    }
}
function getRule(dirName) {
    return cachedRules?.get(dirName);
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
                        procDir: path.join(dirCursor, "/"),
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
        const parentProcessors = await resolveProcessors(root, path.join(path.dirname(dirCursor), "/"), path.join(path.basename(dirCursor), fileName));
        parentProcessors.forEach(foundEntries.add, foundEntries);
    }
    return foundEntries;
}
module.exports = {
    initRules,
    getRule,
    resolveProcessors
};
//# sourceMappingURL=wrules.js.map