import type fsEntries = require("./fsEntries");
import Processor = require("./processor");
export interface ProcessorOutput {
    files: Map<string, fsEntries.BufferLike>;
    result: any;
}
export interface ProcessorResult {
    files: Set<string>;
    result: any;
}
export interface ResultOnlyProcessorState {
    status: "resultonly";
    result: ProcessorResult;
}
export interface EmptyProcessorState {
    status: "empty";
}
export interface ErrorProcessorState {
    status: "error";
    err: any;
}
export interface BuildingProcessorState {
    status: "building";
    pendingResult: Promise<["ok", ProcessorResult] | ["err", any]>;
    resolve: (value: ProcessorResult) => void;
    reject: (reason?: any) => void;
}
export interface BuiltProcessorState {
    status: "built";
    processor: Processor;
    result: ProcessorResult;
}
export type ProcessorState = ResultOnlyProcessorState | EmptyProcessorState | BuildingProcessorState | BuiltProcessorState | ErrorProcessorState;
//# sourceMappingURL=processorStates.d.ts.map