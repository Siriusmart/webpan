import Processor = require("../types/processor");
declare function getProcessor(root: string, ident: string): Promise<{
    new (): Processor;
}>;
export = getProcessor;
//# sourceMappingURL=getProcessor.d.ts.map