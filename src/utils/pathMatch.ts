import micromatch from "micromatch";

export function pathMatch(path: string, pattern: string): boolean {
    return pattern.split('|').some(pattern => micromatch.isMatch(path, pattern));
}
