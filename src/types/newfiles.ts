import path = require("path")
import micromatch = require("micromatch")

import type ProcessorHandle = require("./processorHandle")

class NewFiles {
    private internal: Set<string>;
    private handle: ProcessorHandle;

    constructor(internal: Set<string>, handle: ProcessorHandle) {
        this.internal = internal;
        this.handle = handle;
    }

    files(absolute: boolean, pattern?: string): Set<string> {
        let dirPath = this.handle.meta.childPath;

        if (absolute !== true && !dirPath.endsWith("/")) {
            dirPath = path.join(path.dirname(dirPath), "/");
        }

        let out: Set<string> = new Set();

        for (const absPath of this.internal.values()) {
            let relPath;

            if (absolute) {
                relPath = absPath;
            } else {
                if (!absPath.startsWith(dirPath)) {
                    continue;
                }

                relPath = "." + absPath.substring(dirPath.length - 1);
            }

            if (
                pattern === undefined ||
                micromatch.isMatch(relPath, pattern)
            ) {
                out.add(relPath);
            }
        }

        return out;
    }
}

export = NewFiles
