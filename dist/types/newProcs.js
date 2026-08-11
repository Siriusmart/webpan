import micromatch from "micromatch";
export default class NewProcs {
    absolute;
    handle;
    constructor(absolute, handle) {
        this.absolute = absolute;
        this.handle = handle;
    }
    files(options = {}) {
        let dirPath = this.handle.meta.ruleLocation;
        let out = new Map();
        for (const [absPath, procsOfPath] of this.absolute.entries()) {
            let relPath;
            if (options.absolute ?? false) {
                relPath = absPath;
            }
            else {
                if (!absPath.startsWith(dirPath)) {
                    continue;
                }
                relPath = absPath.substring(dirPath.length - 1);
            }
            if ((options.include === undefined && options.exclude === undefined)
                || micromatch.isMatch(relPath, options.include ?? "**", { ignore: options.exclude })) {
                out.set(relPath, procsOfPath);
            }
        }
        return out;
    }
}
//# sourceMappingURL=newProcs.js.map