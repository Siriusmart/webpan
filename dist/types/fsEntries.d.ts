import Stream = require("stream");
export interface HashedEntry {
    fullPath: string;
    childPath: string;
    hash?: string;
}
export interface OutputEntry {
    path: string;
    buffer: Buffer;
}
export interface FsContentEntry {
    fullPath: string;
    childPath: string;
    content: ["file", Buffer] | ["dir"];
}
export type HashedEntries = Map<string, HashedEntry>;
export type OutputEntries = Map<string, OutputEntry>;
export type FsContentEntries = Map<string, FsContentEntry>;
export type BufferLike = string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream;
//# sourceMappingURL=fsEntries.d.ts.map