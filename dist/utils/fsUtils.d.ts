import type fsEntries = require("../types/fsEntries");
import Stream = require("stream");
declare function exists(path: string): Promise<boolean>;
declare function existsFile(path: string): Promise<boolean>;
declare function existsDir(path: string): Promise<boolean>;
declare function readDirRecursive(dir: string): Promise<fsEntries.FsContentEntries>;
declare function writeCreate(target: string, data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream): Promise<void>;
declare const _default: {
    exists: typeof exists;
    existsFile: typeof existsFile;
    existsDir: typeof existsDir;
    readDirRecursive: typeof readDirRecursive;
    writeCreate: typeof writeCreate;
};
export = _default;
//# sourceMappingURL=fsUtils.d.ts.map