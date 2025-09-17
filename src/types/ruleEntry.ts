export type ProcessorType = string | string[] | Map<string, Map<string, any>>

export interface RuleEntryRaw {
    processors?: Map<string, ProcessorType>
}

export interface RuleEntryNormalised {
    processors: Map<string, Map<string, any>>
}
