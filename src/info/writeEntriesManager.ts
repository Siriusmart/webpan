import type writeEntry = require("../types/writeEntry")

type WriteEntryManagerState = "writable" | "readonly" | "disabled";

class WriteEntriesManager {
    bufferedContent: Map<string, writeEntry.WriteEntry> = new Map();
    state: WriteEntryManagerState = "disabled";

    set(path: string, content: writeEntry.WriteEntry): void {
        if(this.state !== "writable") {
            throw new Error("attempt to write to writeEntries when it isn't writeable")
        }

        this.bufferedContent.set(path, content)
    }

    get(path: string): undefined | writeEntry.WriteEntry {
        if(this.state === "disabled") {
            throw new Error("attempt to read from writeEntries when it is disabled")
        }

        return this.bufferedContent.get(path)
    }

    setState(state: WriteEntryManagerState): void {
        if(state === this.state) {
            throw new Error("attempting to set state when unchanged")
        }

        if(state === "disabled") {
            this.bufferedContent.clear()
        }

        this.state = state
    }

    getBuffer(): Map<string, writeEntry.WriteEntry> {
        if(this.state === "disabled") {
            throw new Error("attempt to read from writeEntries when it is disabled")
        }

        return this.bufferedContent
    }
}

export = WriteEntriesManager
