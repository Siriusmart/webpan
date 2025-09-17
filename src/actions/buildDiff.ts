import assert = require("assert");
import vgrules = require("../info/vgrules");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import ProcessorHandle = require("../types/processorHandle");
import type processorStates = require("../types/processorStates");

let cachedProcessors: Map<string, Map<string, ProcessorHandle>> = new Map();

let currentlyBuilding: Promise<void> | null = null;
let nextBuilding: [Promise<void>, Map<string, procEntries.DiffType>] | null = null;

async function buildDiffInternal(fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>): Promise<void> {
    vgrules.initRules(fsContent);

    let toBuild: Promise<processorStates.ProcessorOutput>[] = [];

    for(const [filePath, diffType] of diff.entries()) {
        // IMPORTANT! update cachedProcessors
        switch(diffType) {
            case "removed":
                throw new Error("dunno what to do")
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

    const res = await Promise.all(toBuild)

    // writes output to file
}

async function buildDiff(fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>): Promise<void> {
    if(currentlyBuilding === null) {
        currentlyBuilding = buildDiffInternal(fsContent, diff);
        return await currentlyBuilding;
    }

    if(nextBuilding === null) {
        nextBuilding = [new Promise(async res => {
            assert(nextBuilding !== null)

            for(const [entryPath, entryDiff] of diff.entries()) {
                switch(entryDiff) {
                    case "changed":
                    case "removed":
                        nextBuilding[1].set(entryPath, entryDiff);
                        break;
                    case "created":
                        if(nextBuilding[1].has(entryPath)) {
                            nextBuilding[1].set(entryPath, "changed");
                        } else {
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
    } else {
        await nextBuilding[0]
    }
}
