import { ArrowLeft, ExternalLink, Mic } from 'lucide-preact';
import { type Hymn, hymnBySlug, LEVEL_LABEL, type Recording, scoreUrl, type Setting, statusOf, youtubeEmbedUrl } from '../content/hymns';
import { modeById } from '../theory/modes';
import { href } from '../routes';
import { NotFound } from './not-found';

/** `/library/:slug` — a hymn's settings, each with *play*, *about* and the score. */
export function HymnPage({ slug }: { slug?: string }) {
  const hymn = slug ? hymnBySlug(slug) : undefined;
  if (!hymn) return <NotFound />;

  return (
    <main class="page">
      <a class="back" href={href('/library')}>
        <ArrowLeft aria-hidden="true" />
        Library
      </a>
      <h1>{hymn.title_en}</h1>
      <p class="lede">
        {hymn.title_gr} · {hymn.icxc.service}
        {hymn.level && <span class={`tag tag--${hymn.level}`}>{LEVEL_LABEL[hymn.level]}</span>}
      </p>

      {hymn.settings.map((s) => (
        <SettingSection key={s.id} hymn={hymn} setting={s} />
      ))}
    </main>
  );
}

function SettingSection({ hymn, setting }: { hymn: Hymn; setting: Setting }) {
  const mode = modeById(setting.mode);
  const text = setting.language === 'gr' ? hymn.icxc.text_gr : hymn.icxc.text_en;
  const score = setting.score ? hymn.icxc.scores.find((sc) => sc.path === setting.score) : undefined;

  return (
    <section class="setting" aria-labelledby={`setting-${setting.id}`}>
      <h2 id={`setting-${setting.id}`}>
        {setting.language === 'gr' ? 'Greek' : 'English'} ·{' '}
        {mode && !mode.partial ? <a href={href(`/scales/${mode.id}`)}>{mode.short}</a> : (mode?.short ?? setting.mode)}
      </h2>
      <p class="setting__label">{setting.label}</p>
      <p class="setting__status hint-text">{statusOf(setting)}</p>

      <p class="setting__text" lang={setting.language === 'gr' ? 'el' : 'en'}>
        {text}
      </p>

      <h3>Play</h3>
      {setting.recordings.length === 0 ? (
        <p class="hint-text">No recording yet.</p>
      ) : (
        setting.recordings.map((r) => <Player key={r.youtube} recording={r} />)
      )}

      <h3>About</h3>
      <p>{setting.about}</p>

      <h3>Score</h3>
      {setting.score ? (
        <p>
          <a class="score" href={scoreUrl(setting.score)} target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" />
            Open the PDF on GOA
            {score && ` — ${score.notation} notation, ${(score.label ?? score.source).replace(/[\s|/]+$/, '')}`}
          </a>
        </p>
      ) : (
        <p class="hint-text">GOA has no score for this setting.</p>
      )}

      {mode && !mode.partial && (
        <p>
          <a class="control" href={href(`/library/${hymn.slug}/${setting.id}/practice`)}>
            <Mic aria-hidden="true" />
            Practice this
          </a>
        </p>
      )}
    </section>
  );
}

/** One YouTube embed. It plays in-page and only on a tap: no autoplay, no cookies until then. */
function Player({ recording }: { recording: Recording }) {
  const title = recording.label ? `${recording.singer} — ${recording.label}` : recording.singer;
  return (
    <figure class="player">
      <iframe
        class="player__frame"
        src={youtubeEmbedUrl(recording)}
        title={title}
        loading="lazy"
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <figcaption>{title}</figcaption>
    </figure>
  );
}
