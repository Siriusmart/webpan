"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calcHashedEntries = require("./info/calcHashedEntries");
const fsUtils = require("./utils/fsUtils");
async function main() {
    const dirContent = await fsUtils.readDirRecursive("./src");
    const hashes = await calcHashedEntries(dirContent);
    console.log(hashes);
}
main();
//# sourceMappingURL=index.js.map