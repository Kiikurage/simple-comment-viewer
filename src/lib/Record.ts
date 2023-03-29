export module Record {
    export function map<V1, V2>(
        record: Record<string, V1>,
        fn: (key: string, value: V1) => [string, V2]
    ): Record<string, V2> {
        return Object.fromEntries((Object.entries(record) as [string, V1][]).map(([k1, v1]) => fn(k1, v1)));
    }

    export function mapToRecord<V1, V2>(
        array: V1[],
        fn: (value: V1, index: number, array: V1[]) => [string, V2]
    ): Record<string, V2> {
        return Object.fromEntries(array.map(fn));
    }

    export function mapValue<V1, V2, K extends string>(
        record: Record<K, V1>,
        fn: (value: V1, key: K) => V2
    ): Record<K, V2> {
        const entries = (Object.entries(record) as [K, V1][]).map(([k, v1]) => [k, fn(v1, k)]);

        return Object.fromEntries(entries) as Record<K, V2>;
    }

    export function filter<V1, V2 extends V1>(
        record: Record<string, V1>,
        fn: (value: V1, key: string) => value is V2
    ): Record<string, V2>;
    export function filter<V>(record: Record<string, V>, fn: (value: V, key: string) => boolean): Record<string, V>;
    export function filter<V>(record: Record<string, V>, fn: (value: V, key: string) => boolean): Record<string, V> {
        return Object.fromEntries((Object.entries(record) as [string, V][]).filter(([k, v]) => fn(v, k)));
    }

    export function size(record: Record<string, unknown>): number {
        return Object.keys(record).length;
    }
}
