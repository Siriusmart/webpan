import ProcessorHandle = require("./processorHandle")

export interface WriteEntry {
    processor: ProcessorHandle,
    content: Buffer | "remove"
}
