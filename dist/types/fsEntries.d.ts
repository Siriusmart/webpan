export interface HashedEntry {
    fullPath: string;
    childPath: string;
    hash: string | null;
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
//# sourceMappingURL=fsEntries.d.ts.map