import fs = require("fs/promises");
import type fsEntries = require("../types/fsEntries");
import path = require("path");

async function exists(path: string): Promise<boolean> {
    try {
        await fs.stat(path);
        return true;
    } catch {
        return false;
    }
}

async function existsFile(path: string): Promise<boolean> {
    try {
        const stat = await fs.stat(path);
        return stat.isFile();
    } catch {
        return false;
    }
}

async function existsDir(path: string): Promise<boolean> {
    try {
        const stat = await fs.stat(path);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

async function readDirRecursive(dir: string): Promise<fsEntries.FsContentEntries> {
    const dirItems = await fs.readdir(dir, { recursive: true });

    let dirContents: fsEntries.FsContentEntries = new Map();

    const readTasks = dirItems.map(async childPath => {
        childPath = "/" + childPath;
        const fullPath = path.join(dir, childPath);
        try {
            const fileInfo = await fs.stat(fullPath);
            
            if(fileInfo.isFile()) {
                const fileContent = await fs.readFile(fullPath);
                dirContents.set(childPath, {
                    fullPath,
                    childPath,
                    content: ["file", fileContent]
                });
            } else if (fileInfo.isDirectory()) {
                dirContents.set(childPath + "/", {
                    fullPath: fullPath + "/",
                    childPath: childPath + "/",
                    content: ["dir"]
                });
            } else {
                console.warn(`${fullPath} is nether a file or a directory.`)
            }
        } catch(e) {
            console.error(`Read task for ${fullPath} failed because ${e}.`)
        }
    });

    await Promise.all(readTasks);

    return dirContents;
}

async function writeCreate(target: string, data: fsEntries.BufferLike): Promise<void> {
    const parentDir = path.join(target, "..");

    if(!await exists(parentDir)) {
        fs.mkdir(parentDir, { recursive: true });
    }

    await fs.writeFile(target, data);
}

export = {
    exists,
    existsFile,
    existsDir,
    readDirRecursive,
    writeCreate
};
