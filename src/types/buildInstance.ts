import type wmanifest = require("../types/wmanifest");
import type fsEntries = require("../types/fsEntries");
import type procEntries = require("../types/procEntries");
import type writeEntry = require("../types/writeEntry");
import type ruleEntry = require("../types/ruleEntry");

import WriteEntriesManager = require("../info/writeEntriesManager");
import wrules = require("../info/wrules");
import buildInfo = require("../info/buildInfo");

import cleanBuild = require("../actions/cleanBuild");

class BuildInstance {
    private root: string;
    private manifest: wmanifest.WManifest;
    private writeEntries: WriteEntriesManager;

    // fs
    private fsContent: fsEntries.FsContentEntries;
    private fsHashedEntries: fsEntries.HashedEntries;
    private fsDiff: procEntries.DiffEntries<string>;

    // processor
    private procByFiles: procEntries.ProcByFileMap
    private procById: procEntries.ProcByIdMap;
    private rules: ruleEntry.RuleEntries

    constructor(root: string, manifest: wmanifest.WManifest) {
        this.root = root;
        this.manifest = manifest;
        this.writeEntries = new WriteEntriesManager()

        this.fsContent = new Map()
        this.fsHashedEntries = new Map()
        this.fsDiff = new Map()

        this.procByFiles = new Map()
        this.procById = new Map()
        this.rules = new Map()
    }

    withHashedEntries(hashedEntries: fsEntries.HashedEntries): BuildInstance {
        this.fsHashedEntries = hashedEntries;
        return this;
    }

    async withFsContent(fsContent: fsEntries.FsContentEntries, hashedEntries: fsEntries.HashedEntries, fsDiff: procEntries.DiffEntries<string>): Promise<BuildInstance>{
        this.fsContent = fsContent;
        this.fsHashedEntries = hashedEntries
        this.fsDiff = fsDiff

        await wrules.updateRules(this)
        
        return this
    }

    withProcs(procByFiles: procEntries.ProcByFileMap, procById: procEntries.ProcByIdMap): BuildInstance {
        this.procByFiles = procByFiles
        this.procById = procById
        return this
    }

    withRules(rules: ruleEntry.RuleEntries): BuildInstance {
        this.rules = rules;
        return this
    }

    withBuildCycleState(buildCycleState: writeEntry.WriteEntryManagerState): BuildInstance {
        this.writeEntries.setState(buildCycleState)

        switch(buildCycleState) {
            case "readonly":
                this.fsDiff.clear()
                this.fsContent.clear()
                break;
            default: {}
        }

        return this
    }

    getRoot(): string {
        return this.root
    }

    getWriteEntriesManager(): WriteEntriesManager {
        return this.writeEntries
    }

    getFsDiff(): procEntries.DiffEntries<string> {
        return this.fsDiff
    }

    getFsContent(): fsEntries.FsContentEntries {
        return this.fsContent
    }

    getFsHashedEntries(): fsEntries.HashedEntries {
        return this.fsHashedEntries
    }

    getRules(): ruleEntry.RuleEntries {
        return this.rules
    }

    getProcByFiles(): procEntries.ProcByFileMap {
        return this.procByFiles
    }

    getProcById(): procEntries.ProcByIdMap {
        return this.procById
    }

    async clean(): Promise<void> {
        await cleanBuild(this.root)
    }

    async writeMeta(): Promise<void> {
        await buildInfo.writeBuildInfo(this.root, this.manifest, buildInfo.wrapBuildInfo(this.fsHashedEntries, this.procByFiles, this.rules))
    }
}

export = BuildInstance
