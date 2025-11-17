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

    files(options: { absolute?: boolean, pattern?: string } = {}): Set<string> {
        let dirPath = this.handle.meta.ruleLocation;

        let out: Set<string> = new Set();

        for (const absPath of this.internal.values()) {
            let relPath;

            if (options.absolute ?? false) {
                relPath = absPath;
            } else {
                if (!absPath.startsWith(dirPath)) {
                    continue;
                }

                relPath = absPath.substring(dirPath.length - 1);
            }

            if (
                options.pattern === undefined ||
                micromatch.isMatch(relPath, options.pattern)
            ) {
                out.add(relPath);
            }
        }

        return out;
    }
}

export = NewFiles
