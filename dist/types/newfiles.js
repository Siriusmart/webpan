"use strict";
const path = require("path");
const micromatch = require("micromatch");
class NewFiles {
    internal;
    handle;
    constructor(internal, handle) {
        this.internal = internal;
        this.handle = handle;
    }
    files(absolute, pattern) {
        let dirPath = this.handle.meta.childPath;
        if (absolute !== true && !dirPath.endsWith("/")) {
            dirPath = path.join(path.dirname(dirPath), "/");
        }
        let out = new Set();
        for (const absPath of this.internal.values()) {
            let relPath;
            if (absolute) {
                relPath = absPath;
            }
            else {
                if (!absPath.startsWith(dirPath)) {
                    continue;
                }
                relPath = "." + absPath.substring(dirPath.length - 1);
            }
            if (pattern === undefined ||
                micromatch.isMatch(relPath, pattern)) {
                out.add(relPath);
            }
        }
        return out;
    }
}
module.exports = NewFiles;
//# sourceMappingURL=newfiles.js.map