import path = require("path")
import fs = require("fs/promises")
import fsUtils = require("../utils/fsUtils")
import fsEntries = require("../types/fsEntries")
import procEntries = require("../types/procEntries")
import ProcessorHandle = require("../types/processorHandle")
import Processor = require("../types/processor")
import assert = require("assert")

function replacer(_: string, value: any) {
  if(value instanceof Map) {
    return {
      _t: 'Map',
      _c: Array.from(value.entries())
    };
  }

  if(value instanceof Set) {
    return {
      _t: 'Set',
      _c: Array.from(value.values())
    };
  }

  return value;
}

function reviver(_: string, value: any) {
  if(typeof value === 'object' && value !== null) {
    if (value._t === 'Map') {
      return new Map(value._c);
    }

    if (value._t === 'Set') {
      return new Set(value._c);
    }
  }
  return value;
}

interface BuildResultEntry {
    id: string,
    meta: procEntries.ProcessorMetaEntry,
    state: ["ok", { files: string[], result: any } ] | ["err", string] | ["empty"]
    dependents: string[],
    dependencies: string[]
}

interface BuildInfo {
    hashedEntries: Map<string, string | null>,
    buildCache: BuildResultEntry[]
}

async function readBuildInfo(root: string): Promise<BuildInfo> {
    const buildInfoPath = path.join(root, "meta", "buildInfo.json");

    try {
        if(await fsUtils.existsFile(buildInfoPath)) {
            const content = await fs.readFile(buildInfoPath, "utf8")
            return JSON.parse(content, reviver) as BuildInfo;
        } else {
            return {
                hashedEntries: new Map(),
                buildCache: []
            }
        }
    } catch(e) {
        if(typeof e === "object" && e !== null && "stack" in e) {
            e = e.stack
        }
        throw new Error("Could not read " + buildInfoPath + " because " + e)
    }
}

async function writeBuildInfo(root: string, data: BuildInfo): Promise<void> {
    const buildInfoPath = path.join(root, "meta", "buildInfo.json");
    await fsUtils.writeCreate(buildInfoPath, JSON.stringify(data, replacer))
}

function wrapBuildInfo(hashedEntries: fsEntries.HashedEntries, cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>>): BuildInfo {
    return {
        hashedEntries: new Map(hashedEntries.entries()),
        buildCache: (Array.from(cachedProcessors.values().flatMap((fileProcs) =>
                        fileProcs.values().flatMap((fileProcWithName) =>
                            Array.from(fileProcWithName.values().map((proc) => {
                                let state: ["ok", { files: string[], result: any } ] | ["err", string] | ["empty"]

                                switch(proc.state.status) {
                                    case "built":
                                    case "resultonly":
                                        state = ["ok", { files: Array.from(proc.state.result.files), result: proc.state.result.result }]
                                        break
                                    case "error":
                                        let e = proc.state.err
                                        if(typeof e === "object" && e !== null && "stack" in e) {
                                            e = e.stack
                                        }
                                        state = ["err", e ]
                                        break;
                                    case "empty":
                                        state = ["empty"]
                                        break;
                                    case "building":
                                        throw new Error("Intermediate states should not be possible")
                                }
                                return {
                                    id: proc.id,
                                    meta: proc.meta,
                                    dependents: Array.from(proc.dependents).map(proc => proc.id),
                                    dependencies: Array.from(proc.dependencies).map(proc => proc.id),
                                    state
                                }
                            }))))))
    }
}

function unwrapBuildInfo(root: string, buildInfo: BuildInfo):
    { hashedEntries: fsEntries.HashedEntries, cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> }
{
    let cachedProcessors: Map<string, Map<string, Set<ProcessorHandle>>> = new Map()
    let relationsMap: Map<string, { dependents: string[], dependencies: string[] }> = new Map();

    for(const resultEntry of buildInfo.buildCache) {
        let foundClass: { new(allHandles: Map<string, Map<string, Set<ProcessorHandle>>>, meta: procEntries.ProcessorMetaEntry, id?: string): Processor };
        try {
            foundClass = require(resultEntry.meta.procName)
        } catch(e) {
            throw new Error("Could not load proccessor with name " + resultEntry.meta.procName + " because " + e)
        }

        let procObject = new foundClass(cachedProcessors, resultEntry.meta, resultEntry.id)
        relationsMap.set(resultEntry.id, { dependencies: resultEntry.dependencies, dependents: resultEntry.dependents })

        if(!cachedProcessors.has(resultEntry.meta.childPath)) {
            cachedProcessors.set(resultEntry.meta.childPath, new Map())
        }

        if(!cachedProcessors.get(resultEntry.meta.childPath)?.has(resultEntry.meta.procName)) {
            cachedProcessors.get(resultEntry.meta.childPath)?.set(resultEntry.meta.procName, new Set())
        }

        cachedProcessors.get(resultEntry.meta.childPath)?.get(resultEntry.meta.procName)?.add(procObject.handle)

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
                }
                break;
            case "err":
                procObject.handle.state = {
                    status: "error",
                    err: resultEntry.state[1]
                }
                break
        }
    }

    for(let [id, handle] of ProcessorHandle.getHandlesIdMap().entries()) {
        const relationEntry = relationsMap.get(id);
        assert(relationEntry !== undefined)

        const { dependencies, dependents } = relationEntry
        handle.dependencies = new Set(dependencies.map((id) => {
            const dependency = ProcessorHandle.getHandle(id)
            assert(dependency !== null)
            return dependency
        }))

        handle.dependents = new Set(dependents.map((id) => {
            const dependency = ProcessorHandle.getHandle(id)
            assert(dependency !== null)
            return dependency
        }))
    }

    return {
        hashedEntries: buildInfo.hashedEntries,
        cachedProcessors
    }
}

export = {
    readBuildInfo,
    writeBuildInfo,
    wrapBuildInfo,
    unwrapBuildInfo
}
