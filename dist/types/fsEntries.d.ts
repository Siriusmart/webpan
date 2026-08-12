import fs from "fs/promises";
export interface OutputEntry {
    path: string;
    buffer: Buffer;
}
export interface FsContentEntry {
    fullPath: string;
    childPath: string;
    content: ["file", Buffer] | ["dir"];
}
export type HashedEntries = Map<string, string | null>;
export type OutputEntries = Map<string, OutputEntry>;
export type FsContentEntries = Map<string, FsContentEntry>;
export type BufferLike = Parameters<typeof fs.writeFile>[1];
//# sourceMappingURL=fsEntries.d.ts.map