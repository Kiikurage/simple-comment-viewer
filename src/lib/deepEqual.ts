export function deepEqual(v1: unknown, v2: unknown): boolean {
    if (v1 === v2) return true;
    if (
        typeof v1 !== 'object' ||
        typeof v2 !== 'object' ||
        v1 === null ||
        v2 === null ||
        v1 === undefined ||
        v2 === undefined
    ) {
        return v1 === v2;
    }
    const keys1 = Object.keys(v1);
    const keys2 = Object.keys(v2);
    if (keys1.length !== keys2.length) return false;

    const keys = new Set([...keys1, ...keys2]);
    if (keys.size !== keys1.length) return false;

    for (const key of keys) {
        if (!deepEqual((v1 as any)[key], (v2 as any)[key])) return false;
    }

    return true;
}
