import path = require("path");
import fs = require("fs/promises");

import fsUtils = require("../utils/fsUtils")

async function cleanBuild(root: string): Promise<void> {
    const distPath = path.join(root, "dist");
    if(await fsUtils.exists(distPath)) {
        await fs.rm(distPath, { recursive: true });
    }

    const buildInfoPath = path.join(root, "meta", "buildInfo.json");
    if(await fsUtils.exists(buildInfoPath)) {
        await fs.rm(buildInfoPath);
    }
}

export = cleanBuild;
