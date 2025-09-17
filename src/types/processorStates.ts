import Processor = require("./processor");

export interface ProcessorResult {}

export interface ResultOnlyProcessorState {
    status: "resultonly";
    result: ProcessorResult
}

export interface EmptyProcessorState {
    status: "empty";
}

export interface ErrorProcessorState {
    status: "error";
    err: any
}

export interface BuildingProcessorState {
    status: "building";
    processor: Processor,
    pendingResult: Promise<ProcessorResult>
}

export interface BuiltProcessorState {
    status: "built";
    processor: Processor,
    result: ProcessorResult
}

export type ProcessorState = ResultOnlyProcessorState | EmptyProcessorState | BuildingProcessorState | BuiltProcessorState | ErrorProcessorState;
