import { AudioLines, BookOpen, PenLine, Signpost } from 'lucide-preact';
import { href } from '../routes';

export function Home() {
  return (
    <main class="home">
      <h1>psaltis</h1>
      <p class="lede">Byzantine chant, learned properly: the scales, then the notation, then the hymns.</p>

      <nav class="tiles" aria-label="Sections">
        <a class="tile" href={href('/scales')}>
          <AudioLines aria-hidden="true" />
          <h2>Scales</h2>
          <p>The eight modes, one ladder each — Νη Πα Βου Γα Δη Κε Ζω — to play and to tune against.</p>
        </a>

        <div class="tile tile--soon" aria-labelledby="notation-title">
          <PenLine aria-hidden="true" />
          <h2 id="notation-title">Notation</h2>
          <p>
            A reading course through the neume families — quantity, time, quality, martyriai,
            phthorai — each with parallage examples sung against the ladder.
          </p>
          <span class="badge">Coming later</span>
        </div>

        <a class="tile" href={href('/library')}>
          <BookOpen aria-hidden="true" />
          <h2>Library</h2>
          <p>The Sunday hymns: play, learn, read the score, and mark what you know.</p>
        </a>
      </nav>

      <a class="start" href={href('/start')}>
        <Signpost aria-hidden="true" />
        Where do I start?
      </a>
    </main>
  );
}
