import type writeEntry = require("../types/writeEntry")

class WriteEntriesManager {
    private bufferedContent: Map<string, writeEntry.WriteEntry> = new Map();
    private state: writeEntry.WriteEntryManagerState = "disabled";

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

    setState(state: writeEntry.WriteEntryManagerState): void {
        switch(this.state) {
            case "disabled":
                if(state !== "writable") {
                    throw new Error("the state after disabled should be writable")
                }
                break
            case "writable":
                if(state !== "readonly") {
                    throw new Error("the state after writable should be readonly")
                }
                break
            case "readonly":
                if(state !== "disabled") {
                    throw new Error("the state after readonly should be disabled")
                }
                break
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
