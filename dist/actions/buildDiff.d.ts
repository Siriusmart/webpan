import fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import WriteEntriesManager = require("../info/writeEntriesManager");
import type wmanifest = require("../types/wmanifest");
declare function buildDiff(root: string, manifest: wmanifest.WManifest, writeEntries: WriteEntriesManager, fsContent: fsEntries.FsContentEntries, diff: procEntries.DiffEntries<string>, hashedEntries: fsEntries.HashedEntries): Promise<void>;
export = buildDiff;
//# sourceMappingURL=buildDiff.d.ts.map