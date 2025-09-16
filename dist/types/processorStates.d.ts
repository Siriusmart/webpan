import processor = require("./processor");
export interface ProcessorResult {
}
export interface ResultOnlyProcessorState {
    status: "resultonly";
    results: ProcessorResult;
}
export interface EmptyProcessorState {
    status: "empty";
}
export interface BuildingProcessorState {
    status: "building";
}
export interface BuiltProcessorState {
    status: "built";
    processor: processor;
    results: ProcessorResult;
}
export interface ProcessorState {
    status: "resultonly" | "empty" | "building" | "built";
}
//# sourceMappingURL=processorStates.d.ts.map