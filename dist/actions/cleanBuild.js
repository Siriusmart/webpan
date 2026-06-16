import path from "path";
import fs from "fs/promises";
import fsUtils from "../utils/fsUtils.js";
async function cleanBuild(root) {
    const distPath = path.join(root, "build/dist");
    if (await fsUtils.exists(distPath)) {
        await fs.rm(distPath, { recursive: true });
    }
    const shadowPath = path.join(root, "build/shadowed");
    if (await fsUtils.exists(shadowPath)) {
        await fs.rm(shadowPath, { recursive: true });
    }
    const buildInfoPath = path.join(root, "build/buildInfo.json");
    if (await fsUtils.exists(buildInfoPath)) {
        await fs.rm(buildInfoPath);
    }
}
export default cleanBuild;
//# sourceMappingURL=cleanBuild.js.map