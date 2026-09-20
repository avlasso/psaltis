import { Autocorrelation } from './acf';
import { McLeod } from './mcleod';
import { Yin } from './yin';

export type { Detector, Estimate } from './types';
export { McLeod, Yin, Autocorrelation };

/** The candidates the lab page runs side by side, in the order they are shown. */
export function allDetectors() {
  return [new McLeod(), new Yin(), new Autocorrelation()];
}
