export interface HashedEntry {
    path: string;
    hash: string;
    buffer: Buffer;
}
export interface OutputEntry {
    path: string;
    buffer: Buffer;
}
export interface FsContentEntry {
    fullPath: string;
    childPath: string;
    entryType: "file" | "dir";
    content: Buffer | null;
}
//# sourceMappingURL=fsentries.d.ts.map