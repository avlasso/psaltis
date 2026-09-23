/**
 * Progress, kept in this browser's IndexedDB and nowhere else (the destination: progress is
 * browser-local by design). Records are plain JSON-serialisable objects under a schema version,
 * so export/import (open decision 7, still open) is a later addition rather than a migration.
 *
 * The app reads everything once into memory and renders from that; a tick updates memory at
 * once and writes through. If IndexedDB will not open (some private windows), ticks still work
 * for the visit and `persistent` says they will not survive it.
 */

import { useEffect, useState } from 'preact/hooks';
import { type Axis, emptyTicks, type Ticks } from '../content/mastery';

/** Bump when a record's shape changes, and read old versions forward in `fromStored`. */
export const SCHEMA_VERSION = 1;

const DB_NAME = 'psaltis';
const DB_VERSION = 1;
const MASTERY = 'mastery';

/** One setting's mastery, keyed `<hymn id>/<setting id>`. */
export interface MasteryRecord {
  schema: typeof SCHEMA_VERSION;
  key: string;
  ticks: Ticks;
}

export function masteryKey(hymnId: string, settingId: string): string {
  return `${hymnId}/${settingId}`;
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => r.result.createObjectStore(MASTERY, { keyPath: 'key' });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function fromStored(raw: unknown): MasteryRecord | undefined {
  const r = raw as Partial<MasteryRecord> | undefined;
  if (!r || r.schema !== SCHEMA_VERSION || typeof r.key !== 'string' || !r.ticks) return undefined;
  return { schema: SCHEMA_VERSION, key: r.key, ticks: { ...emptyTicks(), ...r.ticks } };
}

export async function readAllMastery(): Promise<MasteryRecord[]> {
  const db = await openDb();
  try {
    const all = await request(db.transaction(MASTERY).objectStore(MASTERY).getAll());
    return all.map(fromStored).filter((r): r is MasteryRecord => r !== undefined);
  } finally {
    db.close();
  }
}

export async function writeMastery(record: MasteryRecord): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(MASTERY, 'readwrite');
    tx.objectStore(MASTERY).put(record);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// --- the in-memory copy the pages render from ---------------------------------------------------

const records = new Map<string, MasteryRecord>();
const listeners = new Set<() => void>();
let loaded: Promise<void> | undefined;
let persistent = true;

function notify() {
  for (const l of listeners) l();
}

function load(): Promise<void> {
  loaded ??= readAllMastery().then(
    (all) => {
      for (const r of all) if (!records.has(r.key)) records.set(r.key, r);
      notify();
    },
    () => {
      persistent = false;
      notify();
    },
  );
  return loaded;
}

export function ticksOf(key: string): Ticks {
  return records.get(key)?.ticks ?? emptyTicks();
}

/** Ticks or unticks one item, dated today, and writes the setting's record through. */
export function setTick(key: string, axis: Axis, item: string, on: boolean): void {
  const old = ticksOf(key);
  const ticks: Ticks = { ear: { ...old.ear }, notation: { ...old.notation } };
  if (on) ticks[axis][item] = new Date().toISOString().slice(0, 10);
  else delete ticks[axis][item];
  const record: MasteryRecord = { schema: SCHEMA_VERSION, key, ticks };
  records.set(key, record);
  notify();
  if (persistent) {
    writeMastery(record).catch(() => {
      persistent = false;
      notify();
    });
  }
}

/**
 * Re-renders the caller when any mastery changes, and loads the stored records on first use.
 * Returns whether ticks will survive a reload in this browser.
 */
export function useMastery(): { persistent: boolean } {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    void load();
    return () => void listeners.delete(l);
  }, []);
  return { persistent };
}

/** Tests only: forget the in-memory copy, as a reload would. */
export function resetMasteryForTests(): void {
  records.clear();
  loaded = undefined;
  persistent = true;
}
