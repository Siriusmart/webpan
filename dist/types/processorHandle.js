"use strict";
const Processor = require("./processor");
class ProcessorHandle {
    state;
    meta;
    processor;
    handles;
    constructor(handles, meta, processor) {
        this.state = {
            status: "empty"
        };
        this.meta = meta;
        this.handles = handles;
        this.processor = processor;
    }
    async getResult() {
        switch (this.state.status) {
            case "resultonly":
            case "built":
                return this.state.result;
            case "empty":
                const pendingResult = new Promise(async (res, rej) => {
                    try {
                        let result = await this.processor.build();
                        this.state = {
                            status: "built",
                            processor: this.processor,
                            result
                        };
                        res(result);
                    }
                    catch (err) {
                        this.state = {
                            status: "error",
                            err
                        };
                        rej(err);
                    }
                });
                this.state = {
                    status: "building",
                    processor: this.processor,
                    pendingResult: pendingResult
                };
                return await pendingResult;
            case "error":
                throw this.state.err;
            case "building":
                return await this.state.pendingResult;
        }
    }
    async getProcessor() {
        switch (this.state.status) {
            case "building":
            case "resultonly":
            case "empty":
                const pendingResult = new Promise(async (res, rej) => {
                    try {
                        let result = await this.processor.build();
                        this.state = {
                            status: "built",
                            processor: this.processor,
                            result
                        };
                        res(result);
                    }
                    catch (err) {
                        this.state = {
                            status: "error",
                            err
                        };
                        rej(err);
                    }
                });
                this.state = {
                    status: "building",
                    processor: this.processor,
                    pendingResult: pendingResult
                };
                await pendingResult;
                return this.processor;
            case "error":
                throw this.state.err;
            case "built":
                return this.processor;
        }
    }
}
module.exports = ProcessorHandle;
//# sourceMappingURL=processorHandle.js.map