import { Record } from './Record';

describe('Record', () => {
    it('map', () => {
        const prev = { x: 1, y: 2 };
        const next = Record.map(prev, (key, value) => [key + key, value * 10]);

        expect(next).toEqual({ xx: 10, yy: 20 });
        expect(prev).toEqual({ x: 1, y: 2 });
    });

    it('mapValue', () => {
        const prev = { x: 1, y: 2 };
        const next = Record.mapValue(prev, (value) => value * 10);

        expect(next).toEqual({ x: 10, y: 20 });
        expect(prev).toEqual({ x: 1, y: 2 });
    });

    it('filter', () => {
        const prev = { x: 1, y: 2, z: 3 };
        const next = Record.filter(prev, (value) => value % 2 === 1);

        expect(next).toEqual({ x: 1, z: 3 });
        expect(prev).toEqual({ x: 1, y: 2, z: 3 });
    });
});
