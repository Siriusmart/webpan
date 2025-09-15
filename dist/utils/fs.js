"use strict";
const fs = require("fs/promises");
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
        let stat = await fs.stat(path);
        return stat.isFile();
    }
    catch {
        return false;
    }
}
async function existsDir(path) {
    try {
        let stat = await fs.stat(path);
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
async function readFilesRecursive(dir) {
    let dirItems = await fs.readdir(dir, { recursive: true });
    console.log(dirItems);
    return new Map();
}
module.exports = {
    exists,
    existsFile,
    existsDir,
    readFilesRecursive
};
//# sourceMappingURL=fs.js.map