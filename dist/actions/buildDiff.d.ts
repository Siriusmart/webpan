import fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
declare function buildDiff(root: string, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void>;
export = buildDiff;
//# sourceMappingURL=buildDiff.d.ts.map