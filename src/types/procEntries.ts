export interface DependencyEntry {
    priority: number
}

export interface ProcessorMetaEntry {
    fullPath: string,
    childPath: string,
    settings: any,
}

export type DiffType = "changed" | "removed" | "created";
export type DiffEntries<K> = Map<K, DiffType>;
