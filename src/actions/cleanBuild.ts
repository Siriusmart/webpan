import path = require("path");
import fs = require("fs/promises");

async function cleanBuild(root: string): Promise<void> {
    const distPath = path.join(root, "dist");
    await fs.rmdir(distPath);
}

export = cleanBuild;
