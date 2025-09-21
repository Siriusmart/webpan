import type fsEntries = require("./fsEntries");
import Processor = require("./processor");

export interface ProcessorOutput {
    files: Map<string, fsEntries.BufferLike>,
    prop: any
}

export interface ProcessorResult {
    files: Set<string>,
    prop: any
}

export interface ResultOnlyProcessorState {
    status: "resultonly";
    result: ProcessorResult
}

export interface EmptyProcessorState {
    status: "empty";
    pendingResult: Promise<ProcessorResult> // as no processors are left unbuilt
    resolve: (value: ProcessorResult) => void,
    reject: (reason?: any) => void,
}

export interface ErrorProcessorState {
    status: "error";
    err: any
}

export interface BuildingProcessorState {
    status: "building";
    processor: Processor,
    pendingResult: Promise<ProcessorResult>
    resolve?: (value: ProcessorResult) => void,
    reject?: (reason?: any) => void,
}

export interface BuiltProcessorState {
    status: "built";
    processor: Processor,
    result: ProcessorResult
}

export type ProcessorState = ResultOnlyProcessorState | EmptyProcessorState | BuildingProcessorState | BuiltProcessorState | ErrorProcessorState;
