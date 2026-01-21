import type writeEntry = require("../types/writeEntry");
import type fsEntries = require("../types/fsEntries")
import path = require("path");
import assert = require("assert");

interface OutputActions {
    removes: string[],
    // moves 1 to be completed before moves 2
    // moves 1 is to move the file from dist to shadowed
    // moves 2 is to move files from shadowed to dist
    moves1: [string, string][], // from, to
    moves2: [string, string][], // from, to
    writes: [string, fsEntries.BufferLike][],
}

function targetSet(target: writeEntry.OutputTarget, writeEntry: writeEntry.WriteEntry): void {
    target.newWrites.set(writeEntry.processor.id, writeEntry)
}

class WriteEntriesManager {
    private state: writeEntry.WriteEntryManagerState = "disabled";
    private outputTargets: Map<string, writeEntry.OutputTarget>;

    constructor(outputTargets: Map<string, writeEntry.OutputTarget>) {
        this.outputTargets = outputTargets
    }

    __getOutputTargets(): Map<string, writeEntry.OutputTarget> {
        return this.outputTargets
    }

    set(path: string, content: writeEntry.WriteEntry): void {
        if (this.state !== "writable") {
            throw new Error(
                "attempt to write to writeEntries when it isn't writeable"
            );
        }

        let target = this.outputTargets.get(path)

        if (target === undefined) {
            this.outputTargets.set(path, {
                surface: null,

                allOutputs: new Map([[content.processor.id, content.priority]]),
                newWrites: new Map([[content.processor.id, content]])
            })
        } else {
            target.newWrites.set(content.processor.id, content)
        }
    }

    getActions(): OutputActions {
        if (this.state === "disabled") {
            throw new Error(
                "attempt to read from writeEntries when it is disabled"
            );
        }

        let removes: string[] = []

        for (const [childPath, targetEntry] of this.outputTargets.entries())
            for (const [prodId, writeEntry] of targetEntry.newWrites)
                if (writeEntry.content === "remove") {
                    if (targetEntry.surface !== null && writeEntry.processor.id === targetEntry.surface.procId) {
                        removes.push(path.join("dist", childPath))
                        targetEntry.surface = null
                    } else removes.push(path.join("meta/shadowed", childPath) + `.${prodId}`)

                    targetEntry.allOutputs.delete(prodId)
                }

        let writes: [string, fsEntries.BufferLike][] = []

        for (const [childPath, targetEntry] of this.outputTargets.entries())
            for (const [prodId, writeEntry] of targetEntry.newWrites)
                if (writeEntry.content !== "remove") {
                    if (targetEntry.surface !== null && writeEntry.processor.id === targetEntry.surface.procId)
                        writes.push([path.join("dist", childPath), writeEntry.content])
                    else writes.push([path.join("meta/shadowed", childPath) + `.${prodId}`, writeEntry.content])

                    targetEntry.allOutputs.set(prodId, writeEntry.priority)
                }

        let moves1: [string, string][] = []
        let moves2: [string, string][] = []

        for (const [childPath, targetEntry] of this.outputTargets.entries()) {
            if (targetEntry.allOutputs.size === 0) continue;

            let entries = Array.from(targetEntry.allOutputs.entries())

            let maxPrioxity = entries[0]?.[1] as number;
            let maxPrioxityProc = entries[0]?.[0] as string;

            for (const [procId, priority] of entries) {
                if (priority > maxPrioxity) {
                    maxPrioxity = priority
                    maxPrioxityProc = procId
                }
            }

            if (targetEntry.surface === null) {
                targetEntry.surface = { procId: maxPrioxityProc, priority: maxPrioxity }
                moves2.push([path.join("meta/shadowed", childPath) + `.${maxPrioxityProc}`, path.join("dist", childPath)])
            } else if (targetEntry.surface.priority < maxPrioxity && targetEntry.surface.procId !== maxPrioxityProc) {
                moves1.push([path.join("dist", childPath), path.join("meta/shadowed", childPath) + `.${targetEntry.surface?.procId}`])
                moves2.push([path.join("meta/shadowed", childPath) + `.${maxPrioxityProc}`, path.join("dist", childPath)])
            }
        }

        return {
            writes,
            removes,
            moves1,
            moves2
        }
    }

    setState(state: writeEntry.WriteEntryManagerState): void {
        switch (this.state) {
            case "disabled":
                if (state !== "writable") {
                    throw new Error(
                        "the state after disabled should be writable"
                    );
                }
                break;
            case "writable":
                if (state !== "readonly") {
                    throw new Error(
                        "the state after writable should be readonly"
                    );
                }
                break;
            case "readonly":
                if (state !== "disabled") {
                    throw new Error(
                        "the state after readonly should be disabled"
                    );
                }
                break;
        }

        if (state === "disabled")
            for (const [childPath, targetEntry] of this.outputTargets.entries())
                if (targetEntry.allOutputs.size === 0)
                    this.outputTargets.delete(childPath)

        this.state = state;
    }
}

export = WriteEntriesManager;
