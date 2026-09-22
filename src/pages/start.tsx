import { ArrowLeft } from 'lucide-preact';
import guide from '/catalogue/guide/where-do-i-start.md?raw';
import { Prose } from '../content/prose';
import { href } from '../routes';

/**
 * `/start` — the help page for someone who has never opened the app (work item 10). Every word
 * of it is in `catalogue/guide/where-do-i-start.md`; this component only frames it.
 */
export function Start() {
  return (
    <main class="page">
      <a class="back" href={href('/')}>
        <ArrowLeft aria-hidden="true" />
        Home
      </a>
      <Prose markdown={guide} />
    </main>
  );
}
