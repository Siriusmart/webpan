"use strict";
const WriteEntriesManager = require("../info/writeEntriesManager");
const wrules = require("../info/wrules");
const buildInfo = require("../info/buildInfo");
const cleanBuild = require("../actions/cleanBuild");
class BuildInstance {
    root;
    manifest;
    writeEntries;
    // fs
    fsContent;
    fsHashedEntries;
    fsDiff;
    // processor
    procByFiles;
    procById;
    rules;
    constructor(root, manifest) {
        this.root = root;
        this.manifest = manifest;
        this.writeEntries = new WriteEntriesManager();
        this.fsContent = new Map();
        this.fsHashedEntries = new Map();
        this.fsDiff = new Map();
        this.procByFiles = new Map();
        this.procById = new Map();
        this.rules = new Map();
    }
    withHashedEntries(hashedEntries) {
        this.fsHashedEntries = hashedEntries;
        return this;
    }
    async withFsContent(fsContent, hashedEntries, fsDiff) {
        this.fsContent = fsContent;
        this.fsHashedEntries = hashedEntries;
        this.fsDiff = fsDiff;
        await wrules.updateRules(this);
        return this;
    }
    withProcs(procByFiles, procById) {
        this.procByFiles = procByFiles;
        this.procById = procById;
        return this;
    }
    withRules(rules) {
        this.rules = rules;
        return this;
    }
    withBuildCycleState(buildCycleState) {
        this.writeEntries.setState(buildCycleState);
        switch (buildCycleState) {
            case "readonly":
                this.fsDiff.clear();
                this.fsContent.clear();
                break;
            default: { }
        }
        return this;
    }
    getRoot() {
        return this.root;
    }
    getWriteEntriesManager() {
        return this.writeEntries;
    }
    getFsDiff() {
        return this.fsDiff;
    }
    getFsContent() {
        return this.fsContent;
    }
    getFsHashedEntries() {
        return this.fsHashedEntries;
    }
    getRules() {
        return this.rules;
    }
    getProcByFiles() {
        return this.procByFiles;
    }
    getProcById() {
        return this.procById;
    }
    async clean() {
        await cleanBuild(this.root);
    }
    async writeMeta() {
        await buildInfo.writeBuildInfo(this.root, this.manifest, buildInfo.wrapBuildInfo(this.fsHashedEntries, this.procByFiles, this.rules));
    }
}
module.exports = BuildInstance;
//# sourceMappingURL=buildInstance.js.map