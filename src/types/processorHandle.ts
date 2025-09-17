export = ProcessorHandle;

import type procEntries = require("./procEntries");
import Processor = require("./processor");
import type processorStates = require("./processorStates");

class ProcessorHandle {
    state: processorStates.ProcessorState;
    meta: procEntries.ProcessorMetaEntry;
    processor: Processor;
    handles: Map<string, Map<string, ProcessorHandle>>;

    constructor(handles: Map<string, Map<string, ProcessorHandle>>, meta: procEntries.ProcessorMetaEntry, processor: Processor) {
        this.state = {
            status: "empty"
        };
        this.meta = meta;
        this.handles = handles;
        this.processor = processor;
    }

    async getResult(): Promise<processorStates.ProcessorResult> {
        switch(this.state.status) {
            case "resultonly":
            case "built":
                return this.state.result;
            case "empty":
                const pendingResult: Promise<processorStates.ProcessorResult> = new Promise(async (res, rej) => {
                    try {
                        let result = await this.processor.build();
                        this.state = {
                            status: "built",
                            processor: this.processor,
                            result
                        }
                        res(result);
                    } catch(err) {
                        this.state = {
                            status: "error",
                            err
                        }
                        rej(err);
                    }
                })
                this.state = {
                    status: "building",
                    processor: this.processor,
                    pendingResult: pendingResult
                }
                return await pendingResult;
            case "error":
                throw this.state.err;
            case "building":
                return await this.state.pendingResult;
        }
    }

    async getProcessor(): Promise<Processor> {
        switch(this.state.status) {
            case "building":
            case "resultonly":
            case "empty":
                const pendingResult: Promise<processorStates.ProcessorResult> = new Promise(async (res, rej) => {
                    try {
                        let result = await this.processor.build();
                        this.state = {
                            status: "built",
                            processor: this.processor,
                            result
                        }
                        res(result);
                    } catch(err) {
                        this.state = {
                            status: "error",
                            err
                        }
                        rej(err);
                    }
                })
                this.state = {
                    status: "building",
                    processor: this.processor,
                    pendingResult: pendingResult
                }

                await pendingResult;
                return this.processor;
            case "error":
                throw this.state.err;
            case "built":
                return this.processor;
        }
    }
}
