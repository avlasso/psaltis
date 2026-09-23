import { emptyTicks } from '../content/mastery';
import { type MasteryRecord, masteryKey, readAllMastery, SCHEMA_VERSION, writeMastery } from './store';

describe('mastery store', () => {
  it('reads back what it wrote, as plain versioned records', async () => {
    const ticks = emptyTicks();
    ticks.ear['from-memory'] = '2026-09-22';
    const record: MasteryRecord = { schema: SCHEMA_VERSION, key: masteryKey('hymn', 'gr-pl4'), ticks };
    await writeMastery(record);

    const all = await readAllMastery();
    expect(all).toEqual([record]);
    expect(JSON.parse(JSON.stringify(all))).toEqual(all);
  });
});
