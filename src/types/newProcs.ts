import micromatch from "micromatch";
import type ProcessorHandle from "./processorHandle.js";
import { pathMatch } from "../utils/pathMatch.js";

export type NewProcsAbsolute = Map<string, Set<string>>;

export default class NewProcs {
    private absolute: NewProcsAbsolute;
    private handle: ProcessorHandle;

    constructor(absolute: NewProcsAbsolute, handle: ProcessorHandle) {
        this.absolute = absolute;
        this.handle = handle;
    }

    files(options: { absolute?: boolean, include?: string } = {}): Map<string, Set<string>> {
        let dirPath = this.handle.meta.ruleLocation;
        let out: Map<string, Set<string>> = new Map();

        for (const [absPath, procsOfPath] of this.absolute.entries()) {
            let relPath;

            if (options.absolute ?? false) {
                relPath = absPath;
            } else {
                if (!absPath.startsWith(dirPath)) {
                    continue
                }

                relPath = absPath.substring(dirPath.length - 1);
            }

            if ((options.include === undefined)
                || pathMatch(relPath, options.include ?? "**")) {
                out.set(relPath, procsOfPath);
            }
        }

        return out;
    }
}
