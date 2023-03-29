export function getClosestValue(array: number[], value: number): number {
    if (array.length === 0) throw new Error('?');
    let bestValue = Infinity;
    for (const v of array) {
        if (Math.abs(v - value) < Math.abs(bestValue - value)) bestValue = v;
    }
    return bestValue;
}
