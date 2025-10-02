"use strict";
const path = require("path");
const fs = require("fs/promises");
const fsUtils = require("../utils/fsUtils");
const fsEntries = require("../types/fsEntries");
const procEntries = require("../types/procEntries");
const ProcessorHandle = require("../types/processorHandle");
const Processor = require("../types/processor");
const writeEntry = require("../types/writeEntry");
const ruleEntry = require("../types/ruleEntry");
const assert = require("assert");
function replacer(_, value) {
    if (value instanceof Map) {
        return {
            _t: 'Map',
            _c: Array.from(value.entries())
        };
    }
    if (value instanceof Set) {
        return {
            _t: 'Set',
            _c: Array.from(value.values())
        };
    }
    return value;
}
function reviver(_, value) {
    if (typeof value === 'object' && value !== null) {
        if (value._t === 'Map') {
            return new Map(value._c);
        }
        if (value._t === 'Set') {
            return new Set(value._c);
        }
    }
    return value;
}
async function readBuildInfo(root) {
    const buildInfoPath = path.join(root, "meta", "buildInfo.json");
    try {
        if (await fsUtils.existsFile(buildInfoPath)) {
            const content = await fs.readFile(buildInfoPath, "utf8");
            return JSON.parse(content, reviver);
        }
        else {
            return {
                hashedEntries: new Map(),
                rules: new Map(),
                buildCache: []
            };
        }
    }
    catch (e) {
        if (typeof e === "object" && e !== null && "stack" in e) {
            e = e.stack;
        }
        throw new Error("Could not read " + buildInfoPath + " because " + e);
    }
}
async function writeBuildInfo(root, manifest, data) {
    const buildInfoPath = path.join(root, "meta", "buildInfo.json");
    await fsUtils.writeCreate(buildInfoPath, JSON.stringify(data, replacer, manifest.format.buildInfo ? manifest.format.tabSpaces : 0));
}
function wrapBuildInfo(hashedEntries, cachedProcessors, cachedRules) {
    return {
        hashedEntries,
        rules: cachedRules,
        buildCache: (Array.from(cachedProcessors.values().flatMap((fileProcs) => fileProcs.values().flatMap((fileProcWithName) => Array.from(fileProcWithName.values().map((proc) => {
            let state;
            switch (proc.state.status) {
                case "built":
                case "resultonly":
                    state = ["ok", { files: Array.from(proc.state.result.files), result: proc.state.result.result }];
                    break;
                case "error":
                    let e = proc.state.err;
                    if (typeof e === "object" && e !== null && "stack" in e) {
                        e = e.stack;
                    }
                    state = ["err", e];
                    break;
                case "empty":
                    state = ["empty"];
                    break;
                case "building":
                    throw new Error("Intermediate states should not be possible");
            }
            return {
                id: proc.id,
                meta: proc.meta,
                dependents: Array.from(proc.dependents).map(proc => proc.id),
                dependencies: Array.from(proc.dependencies).map(proc => proc.id),
                state
            };
        }))))))
    };
}
function unwrapBuildInfo(writeEntries, buildInfo) {
    let cachedProcessors = new Map();
    let relationsMap = new Map();
    for (const resultEntry of buildInfo.buildCache) {
        let foundClass;
        try {
            foundClass = require(resultEntry.meta.procName);
        }
        catch (e) {
            throw new Error("Could not load proccessor with name " + resultEntry.meta.procName + " because " + e);
        }
        let procObject = new foundClass(cachedProcessors, writeEntries, resultEntry.meta, resultEntry.id);
        relationsMap.set(resultEntry.id, { dependencies: resultEntry.dependencies, dependents: resultEntry.dependents });
        if (!cachedProcessors.has(resultEntry.meta.childPath)) {
            cachedProcessors.set(resultEntry.meta.childPath, new Map());
        }
        if (!cachedProcessors.get(resultEntry.meta.childPath)?.has(resultEntry.meta.procName)) {
            cachedProcessors.get(resultEntry.meta.childPath)?.set(resultEntry.meta.procName, new Set());
        }
        cachedProcessors.get(resultEntry.meta.childPath)?.get(resultEntry.meta.procName)?.add(procObject.handle);
        switch (resultEntry.state[0]) {
            case "empty":
                break; // it is empty by default
            case "ok":
                procObject.handle.state = {
                    status: "resultonly",
                    result: {
                        files: new Set(resultEntry.state[1].files),
                        result: resultEntry.state[1].result
                    }
                };
                break;
            case "err":
                procObject.handle.state = {
                    status: "error",
                    err: resultEntry.state[1]
                };
                break;
        }
    }
    for (let [id, handle] of ProcessorHandle.getHandlesIdMap().entries()) {
        const relationEntry = relationsMap.get(id);
        assert(relationEntry !== undefined);
        const { dependencies, dependents } = relationEntry;
        handle.dependencies = new Set(dependencies.map((id) => {
            const dependency = ProcessorHandle.getHandle(id);
            assert(dependency !== null);
            return dependency;
        }));
        handle.dependents = new Set(dependents.map((id) => {
            const dependency = ProcessorHandle.getHandle(id);
            assert(dependency !== null);
            return dependency;
        }));
    }
    return {
        hashedEntries: buildInfo.hashedEntries,
        cachedRules: buildInfo.rules,
        cachedProcessors
    };
}
module.exports = {
    readBuildInfo,
    writeBuildInfo,
    wrapBuildInfo,
    unwrapBuildInfo
};
//# sourceMappingURL=buildInfo.js.map