export interface DependencyEntry {
    path: string,
    priority: number
}

export type DiffType = "changed" | "removed" | "created";
