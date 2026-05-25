import path from "path";
import fs from "fs/promises";

import fsUtils from "../utils/fsUtils.js";

async function cleanBuild(root: string): Promise<void> {
    const distPath = path.join(root, "dist");
    if (await fsUtils.exists(distPath)) {
        await fs.rm(distPath, { recursive: true });
    }

    const shadowPath = path.join(root, "meta/shadowed");
    if (await fsUtils.exists(shadowPath)) {
        await fs.rm(shadowPath, { recursive: true });
    }

    const buildInfoPath = path.join(root, "meta", "buildInfo.json");
    if (await fsUtils.exists(buildInfoPath)) {
        await fs.rm(buildInfoPath);
    }
}

export default cleanBuild;
