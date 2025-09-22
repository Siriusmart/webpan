"use strict";
const path = require("path");
const fs = require("fs/promises");
const fsUtils = require("../utils/fsUtils");
async function cleanBuild(root) {
    const distPath = path.join(root, "dist");
    if (await fsUtils.exists(distPath)) {
        await fs.rm(distPath, { recursive: true });
    }
}
module.exports = cleanBuild;
//# sourceMappingURL=cleanBuild.js.map