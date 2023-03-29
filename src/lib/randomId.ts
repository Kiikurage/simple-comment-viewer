const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';

export function randomId() {
    return 'xxxxxxxx'.replace(/x/g, () => {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return CHARS[Math.floor(Math.random() * CHARS.length)]!;
    });
}
