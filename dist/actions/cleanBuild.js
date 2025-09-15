"use strict";
const path = require("path");
const fs = require("fs/promises");
async function cleanBuild(root) {
    const distPath = path.join(root, "dist");
    await fs.rmdir(distPath);
}
module.exports = cleanBuild;
//# sourceMappingURL=cleanBuild.js.map