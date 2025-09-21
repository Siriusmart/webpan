export interface ProcessorMetaEntry {
    fullPath: string;
    childPath: string;
    procName: string;
    relativePath: string;
    settings: any;
}
export type DiffType = "changed" | "removed" | "created";
export type DiffEntries<K> = Map<K, DiffType>;
//# sourceMappingURL=procEntries.d.ts.map