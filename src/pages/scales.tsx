import { ArrowLeft } from 'lucide-preact';
import { MODES } from '../theory/modes';
import { href } from '../routes';

const GENUS_LABEL = {
  diatonic: 'diatonic',
  softChromatic: 'soft chromatic',
  hardChromatic: 'hard chromatic',
  enharmonic: 'enharmonic',
} as const;

/** The eight modes in roadmap order. Only a sourced mode links to its ladder. */
export function Scales() {
  return (
    <main class="page">
      <a class="back" href={href('/')}>
        <ArrowLeft aria-hidden="true" />
        Home
      </a>
      <h1>Scales</h1>
      <p class="lede">The eight modes, in the order to learn them.</p>

      <ol class="modes">
        {MODES.map((mode) => (
          <li key={mode.id} class={`mode${mode.partial ? ' mode--soon' : ''}`}>
            {mode.partial ? (
              <span class="mode__short">{mode.short}</span>
            ) : (
              <a class="mode__short" href={href(`/scales/${mode.id}`)}>
                {mode.short}
              </a>
            )}
            <span class="mode__name">
              {mode.nameEn} <span class="mode__gr">{mode.nameGr}</span>
            </span>
            <span class="mode__genus">{GENUS_LABEL[mode.genus]}</span>
            {mode.beginner && <span class="badge">Beginner</span>}
            {mode.partial && <span class="mode__soon">not yet</span>}
          </li>
        ))}
      </ol>
    </main>
  );
}
