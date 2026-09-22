import { ArrowLeft } from 'lucide-preact';
import { Practice } from '../components/practice';
import { hymnBySlug } from '../content/hymns';
import { afterHymn, afterScale } from '../content/next-step';
import { modeById } from '../theory/modes';
import { href } from '../routes';
import { NotFound } from './not-found';

/** `/scales/:id/practice` — the mode's ladder with the tuner and no step playback. */
export function ModePractice({ id }: { id?: string }) {
  const mode = id ? modeById(id) : undefined;
  if (!mode || mode.partial || !mode.intervals) return <NotFound />;

  return (
    <main class="page mode-page">
      <a class="back" href={href(`/scales/${mode.id}`)}>
        <ArrowLeft aria-hidden="true" />
        {mode.short}
      </a>
      <h1>Practice {mode.short}</h1>
      <p class="lede">The ladder, your voice, and the ison if you want it.</p>
      <Practice intervals={mode.intervals} next={afterScale(mode.id)} />
    </main>
  );
}

/** `/library/:slug/:setting/practice` — the setting's text with the tuner on its mode's scale. */
export function HymnPractice({ slug, setting: settingId }: { slug?: string; setting?: string }) {
  const hymn = slug ? hymnBySlug(slug) : undefined;
  const setting = hymn?.settings.find((s) => s.id === settingId);
  const mode = setting ? modeById(setting.mode) : undefined;
  if (!hymn || !setting || !mode || mode.partial || !mode.intervals) return <NotFound />;

  const text = setting.language === 'gr' ? hymn.icxc.text_gr : hymn.icxc.text_en;

  return (
    <main class="page mode-page">
      <a class="back" href={href(`/library/${hymn.slug}`)}>
        <ArrowLeft aria-hidden="true" />
        {hymn.title_en}
      </a>
      <h1>Practice {hymn.title_en}</h1>
      <p class="lede">
        {setting.label} · {mode.short}
      </p>
      <Practice intervals={mode.intervals} next={afterHymn(hymn, setting)}>
        <p class="setting__text" lang={setting.language === 'gr' ? 'el' : 'en'}>
          {text}
        </p>
      </Practice>
    </main>
  );
}
