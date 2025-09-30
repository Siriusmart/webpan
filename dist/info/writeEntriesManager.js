"use strict";
class WriteEntriesManager {
    bufferedContent = new Map();
    state = "disabled";
    set(path, content) {
        if (this.state !== "writable") {
            throw new Error("attempt to write to writeEntries when it isn't writeable");
        }
        this.bufferedContent.set(path, content);
    }
    get(path) {
        if (this.state === "disabled") {
            throw new Error("attempt to read from writeEntries when it is disabled");
        }
        return this.bufferedContent.get(path);
    }
    setState(state) {
        if (state === this.state) {
            throw new Error("attempting to set state when unchanged");
        }
        if (state === "disabled") {
            this.bufferedContent.clear();
        }
        this.state = state;
    }
    getBuffer() {
        if (this.state === "disabled") {
            throw new Error("attempt to read from writeEntries when it is disabled");
        }
        return this.bufferedContent;
    }
}
module.exports = WriteEntriesManager;
//# sourceMappingURL=writeEntriesManager.js.map