import micromatch from "micromatch";
export function pathMatch(path, pattern) {
    return pattern.split('|').some(pattern => micromatch.isMatch(path, pattern));
}
//# sourceMappingURL=pathMatch.js.map