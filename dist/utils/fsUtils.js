"use strict";
const fs = require("fs/promises");
const path = require("path");
async function exists(path) {
    try {
        await fs.stat(path);
        return true;
    }
    catch {
        return false;
    }
}
async function existsFile(path) {
    try {
        const stat = await fs.stat(path);
        return stat.isFile();
    }
    catch {
        return false;
    }
}
async function existsDir(path) {
    try {
        const stat = await fs.stat(path);
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
async function readDirRecursive(dir) {
    const dirItems = await fs.readdir(dir, { recursive: true });
    let dirContents = new Map();
    const readTasks = dirItems.map(async (childPath) => {
        childPath = "/" + childPath;
        const fullPath = path.join(dir, childPath);
        try {
            const fileInfo = await fs.stat(fullPath);
            if (fileInfo.isFile()) {
                const fileContent = await fs.readFile(fullPath);
                dirContents.set(childPath, {
                    fullPath,
                    childPath,
                    content: ["file", fileContent]
                });
            }
            else if (fileInfo.isDirectory()) {
                dirContents.set(childPath + "/", {
                    fullPath: fullPath + "/",
                    childPath: childPath + "/",
                    content: ["dir"]
                });
            }
            else {
                console.warn(`${fullPath} is nether a file or a directory.`);
            }
        }
        catch (e) {
            console.error(`Read task for ${fullPath} failed because ${e}.`);
        }
    });
    await Promise.all(readTasks);
    return dirContents;
}
async function writeCreate(target, data) {
    const parentDir = path.join(target, "..");
    if (!await exists(parentDir)) {
        fs.mkdir(parentDir, { recursive: true });
    }
    await fs.writeFile(target, data);
}
module.exports = {
    exists,
    existsFile,
    existsDir,
    readDirRecursive,
    writeCreate
};
//# sourceMappingURL=fsUtils.js.map