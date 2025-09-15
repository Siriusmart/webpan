declare function exists(path: string): Promise<boolean>;
declare function existsFile(path: string): Promise<boolean>;
declare function existsDir(path: string): Promise<boolean>;
declare function readFilesRecursive(dir: string): Promise<Map<string, Buffer>>;
declare const _default: {
    exists: typeof exists;
    existsFile: typeof existsFile;
    existsDir: typeof existsDir;
    readFilesRecursive: typeof readFilesRecursive;
};
export = _default;
//# sourceMappingURL=fs.d.ts.map