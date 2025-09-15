"use strict";
const findRoot = require("../info/findRoot");
const path = require("path");
const fs = require("fs/promises");
async function cmdInit(args) {
    const argPath = args.path;
    const root = await findRoot(argPath);
    if (root !== null) {
        console.error(`Project not initialised: found existing project root at ${root}`);
    }
    else {
        const examplePath = path.join(__dirname, "../../example");
        await fs.cp(examplePath, argPath, { recursive: true });
        console.info("Project initialised");
    }
}
module.exports = cmdInit;
//# sourceMappingURL=cmdInit.js.map