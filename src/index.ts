import calcHashedEntries = require("./info/calcHashedEntries");
import fsUtils = require("./utils/fsUtils");

async function main(): Promise<void> {
    const dirContent = await fsUtils.readDirRecursive("./src");
    const hashes = await calcHashedEntries(dirContent);

    console.log(hashes);
}

main();
