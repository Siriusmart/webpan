"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vgrules = require("../info/vgrules");
const ProcessorHandle = require("../types/processorHandle");
let cachedProcessors = new Map();
let currentlyBuilding = null;
let nextBuilding = null;
async function buildDiffInternal(fsContent, diff) {
    vgrules.initRules(fsContent);
    let toBuild = [];
    for (const [filePath, diffType] of diff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch (diffType) {
            case "removed":
                throw new Error("dunno what to do");
            case "changed":
                // delete the previous build files, then build
                break;
            case "created":
            // get processors
            // insert each task into cachedProcessors (flat)
            // add task to toBuild
            // remember to try catch each build so one failed build dont spoil everything
        }
    }
    const res = await Promise.all(toBuild);
    // writes output to file
}
async function buildDiff(fsContent, diff) {
    if (currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(fsContent, diff);
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
                currentlyBuilding = buildDiffInternal(fsContent, nextBuilding[1]);
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
//# sourceMappingURL=buildDiff.js.map