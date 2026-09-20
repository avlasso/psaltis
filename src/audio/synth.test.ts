import { upAndDown } from './synth';

describe('upAndDown', () => {
  it('climbs Νη…Νη′ and comes back without repeating the top', () => {
    expect(upAndDown(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0]);
  });
});
