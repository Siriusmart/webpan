import type fsentries = require("../types/fsentries");
declare function exists(path: string): Promise<boolean>;
declare function existsFile(path: string): Promise<boolean>;
declare function existsDir(path: string): Promise<boolean>;
declare function readDirRecursive(dir: string): Promise<Map<string, fsentries.FsContentEntry>>;
declare const _default: {
    exists: typeof exists;
    existsFile: typeof existsFile;
    existsDir: typeof existsDir;
    readDirRecursive: typeof readDirRecursive;
};
export = _default;
//# sourceMappingURL=fsutils.d.ts.map