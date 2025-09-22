export interface ProcessorMetaEntry {
    fullPath: string,
    childPath: string,
    procName: string,
    relativePath: string,
    ruleLocation: string,
    pattern: string,
    settings: any,
}

export type DiffType = "changed" | "removed" | "created";
export type DiffEntries<K> = Map<K, DiffType>;
