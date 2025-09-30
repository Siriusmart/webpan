import fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import WriteEntriesManager = require("../info/writeEntriesManager");
declare function buildDiff(root: string, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void>;
export = buildDiff;
//# sourceMappingURL=buildDiff.d.ts.map