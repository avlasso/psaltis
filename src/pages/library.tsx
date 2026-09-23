import { ArrowLeft } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { type Hymn, LEVEL_LABEL, loadCatalogue } from '../content/hymns';
import { AXES, axisStatus, CHECKLIST, matchesStatus, STATUSES, type Status } from '../content/mastery';
import { masteryKey, ticksOf, useMastery } from '../progress/store';
import { MODES, modeById } from '../theory/modes';
import { href } from '../routes';

const ALL = '';

/**
 * `/library` — every hymn with at least one setting, filterable by mode, service and status.
 * Status is per mastery axis; the filter keeps a setting when either axis has the chosen status.
 */
export function Library() {
  const { hymns, problems } = loadCatalogue();
  useMastery();
  const [mode, setMode] = useState(ALL);
  const [service, setService] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const services = [...new Set(hymns.map((h) => h.icxc.service))].sort();
  const modesPresent = MODES.filter((m) => hymns.some((h) => h.settings.some((s) => s.mode === m.id)));

  const shown = hymns.filter(
    (h) =>
      (service === ALL || h.icxc.service === service) &&
      h.settings.some((s) => (mode === ALL || s.mode === mode) && (status === ALL || matchesStatus(ticksOf(masteryKey(h.id, s.id)), status as Status))),
  );

  return (
    <main class="page">
      <a class="back" href={href('/')}>
        <ArrowLeft aria-hidden="true" />
        Home
      </a>
      <h1>Library</h1>
      <p class="lede">The hymns, each in one or more settings.</p>

      {problems.length > 0 && (
        <div class="problems" role="alert">
          <p>Some hymn files did not pass the content check and are not listed:</p>
          <ul>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div class="filters">
        <label class="filter">
          Mode
          <select value={mode} onChange={(e) => setMode(e.currentTarget.value)}>
            <option value={ALL}>all</option>
            {modesPresent.map((m) => (
              <option key={m.id} value={m.id}>
                {m.short}
              </option>
            ))}
          </select>
        </label>
        <label class="filter">
          Service
          <select value={service} onChange={(e) => setService(e.currentTarget.value)}>
            <option value={ALL}>all</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label class="filter">
          Status
          <select value={status} onChange={(e) => setStatus(e.currentTarget.value)}>
            <option value={ALL}>all</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p class="hint-text">No hymn matches these filters.</p>
      ) : (
        <ul class="hymns">
          {shown.map((h) => (
            <li key={h.id}>
              <HymnRow hymn={h} status={status as Status | typeof ALL} mode={mode} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function HymnRow({ hymn, status, mode }: { hymn: Hymn; status: Status | typeof ALL; mode: string }) {
  return (
    <a class="hymn" href={href(`/library/${hymn.slug}`)}>
      <span class="hymn__title">
        {hymn.title_en} <span class="hymn__gr">{hymn.title_gr}</span>
      </span>
      <span class="hymn__service">
        {hymn.icxc.service}
        {hymn.level && <span class={`tag tag--${hymn.level}`}>{LEVEL_LABEL[hymn.level]}</span>}
      </span>
      <span class="hymn__settings">
        {hymn.settings.map((s) => {
          const ticks = ticksOf(masteryKey(hymn.id, s.id));
          const dim = (mode !== ALL && s.mode !== mode) || (status !== ALL && !matchesStatus(ticks, status));
          return (
            <span key={s.id} class={`chip${dim ? ' chip--dim' : ''}`}>
              {s.language.toUpperCase()} · {modeById(s.mode)?.short ?? s.mode}
              {AXES.map((a) => (
                <span key={a} class={`chip__axis chip__axis--${axisStatus(ticks, a).replace(' ', '-')}`}>
                  {' · '}
                  {CHECKLIST[a].title.toLowerCase()}: {axisStatus(ticks, a)}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </a>
  );
}
