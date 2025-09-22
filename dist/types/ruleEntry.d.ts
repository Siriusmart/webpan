export type ProcessorType = string | string[] | Map<string, Map<string, any>>;
export interface RuleEntryRaw {
    processors?: Map<string, Map<string, any>>;
}
export interface ProcessorSettings {
    procName: string;
    settings: Map<string, any>;
}
export interface RuleEntryNormalised {
    processors: Map<string, Set<ProcessorSettings>>;
}
//# sourceMappingURL=ruleEntry.d.ts.map