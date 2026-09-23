import { axisStatus, CHECKLIST, emptyTicks, matchesStatus } from './mastery';

describe('mastery status', () => {
  it('is not started, in progress, then declared as items are ticked', () => {
    const t = emptyTicks();
    expect(axisStatus(t, 'ear')).toBe('not started');
    t.ear[CHECKLIST.ear.items[0].id] = '2026-09-22';
    expect(axisStatus(t, 'ear')).toBe('in progress');
    for (const i of CHECKLIST.ear.items) t.ear[i.id] = '2026-09-22';
    expect(axisStatus(t, 'ear')).toBe('declared');
    expect(axisStatus(t, 'notation')).toBe('not started');
  });

  it('ignores a stored tick whose item is no longer in the checklist', () => {
    const t = emptyTicks();
    t.notation['retired-item'] = '2026-09-22';
    expect(axisStatus(t, 'notation')).toBe('not started');
  });

  it('matches a status on either axis', () => {
    const t = emptyTicks();
    for (const i of CHECKLIST.ear.items) t.ear[i.id] = '2026-09-22';
    expect(matchesStatus(t, 'declared')).toBe(true);
    expect(matchesStatus(t, 'not started')).toBe(true);
    expect(matchesStatus(t, 'in progress')).toBe(false);
  });

  it('has three to five items per axis, with unique ids', () => {
    for (const list of Object.values(CHECKLIST)) {
      expect(list.items.length).toBeGreaterThanOrEqual(3);
      expect(list.items.length).toBeLessThanOrEqual(5);
      expect(new Set(list.items.map((i) => i.id)).size).toBe(list.items.length);
    }
  });
});
