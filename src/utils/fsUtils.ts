import fs = require("fs/promises");
import path = require("path");

import type fsEntries = require("../types/fsEntries");

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
    dirContents.set("/", {
        fullPath: dir,
        childPath: "/",
        content: ["dir"]
    });

    const readTasks = dirItems.map(async childPath => {
        childPath = path.join("/", childPath);
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
                childPath = path.join(childPath, "/")
                dirContents.set(childPath, {
                    fullPath,
                    childPath,
                    content: ["dir"]
                });
            } else {
                console.warn(`${fullPath} is nether a file or a directory.`)
            }
        } catch(e) {
            if(typeof e === "object" && e !== null && "stack" in e) {
                e = e.stack
            }
            throw new Error(`Read task for ${fullPath} failed because ${e}.`)
        }
    });

    await Promise.all(readTasks);

    return dirContents;
}

async function writeCreate(target: string, data: fsEntries.BufferLike): Promise<void> {
    const parentDir = path.join(target, "..");

    if(!await exists(parentDir)) {
        await fs.mkdir(parentDir, { recursive: true });
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
