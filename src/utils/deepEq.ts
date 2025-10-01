function deepEq(a: any, b: any): boolean {
    if(isNaN(a)) {
        return isNaN(b)
    }

    // null or typeof !== object
    if(a === b) {
        return true
    }

    if(typeof a !== "object") {
        return a === b
    }

    if(a.constructor.name !== b.constructor.name) {
        return false
    }

    if(a.constructor.name !== "Object" || a.constructor.name !== "Array") {
        throw new Error("cannot use deepEq on structures other than Object or Array")
    }

    let checkedKeys: Set<string> = new Set()

    for(const [key, value] of Object.entries(a)) {
        checkedKeys.add(key)

        if(!deepEq(value, b[key])) {
            return false
        }
    }


    for(const [key, value] of Object.entries(b)) {
        if(checkedKeys.has(key)) {
            continue
        }

        if(!deepEq(value, a[key])) {
            return false
        }
    }

    return true
}

export = deepEq
