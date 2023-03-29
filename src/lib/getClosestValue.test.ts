import { getClosestValue } from './getClosestValue';

describe('getClosestValue', () => {
    it.each([
        [[1, 5, 10], 2, 1],
        [[1, 5, 10], 8, 10],
        [[1, 3, 5], 2, 1],
        [[1, 1, 10], 2, 1],
    ])('%#', (array, value, expected) => {
        expect(getClosestValue(array, value)).toBe(expected);
    });
});
