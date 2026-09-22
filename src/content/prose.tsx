/**
 * A very small Markdown subset, so page text can live in `catalogue/` as Markdown the operator
 * edits without touching code (work item 10). Deliberately not a Markdown library: the app has
 * four runtime dependencies and this is the whole of what the guide pages ask for.
 *
 * Blocks, separated by a blank line: `# ` and `## ` headings, `- ` bullets, `1. ` numbered
 * items, anything else a paragraph. A wrapped line continues the block above it, as in
 * Markdown. Inline: `**bold**`, `*italic*`, `[text](/route)` and `[text](https://example.org)`.
 *
 * What it does not do, on purpose: nested lists, inline markers inside a link's text, code,
 * images, raw HTML. No HTML passes through — an unsupported marker is shown as written, so a
 * bad edit in the catalogue makes an ugly page, never a broken or unsafe one.
 */

import type { ComponentChildren } from 'preact';
import { href } from '../routes';

export type Block =
  | { kind: 'h1' | 'h2' | 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

const HEADING = /^(#{1,2})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+\.\s+(.*)$/;

export function parseProse(markdown: string): Block[] {
  const blocks: Block[] = [];
  // Whether the last block is still open: a wrapped line joins it, a blank line closes it.
  let open = false;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    const last = blocks.at(-1);

    if (!line) {
      open = false;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: heading[1].length === 1 ? 'h1' : 'h2', text: heading[2] });
      open = false;
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      const item = (bullet ?? numbered)![1];
      if (open && last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
      open = true;
      continue;
    }

    // A wrapped line continues the item or the paragraph above it.
    if (open && last) {
      if ('items' in last) last.items[last.items.length - 1] += ` ${line}`;
      else last.text += ` ${line}`;
    } else {
      blocks.push({ kind: 'p', text: line });
      open = true;
    }
  }
  return blocks;
}

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Splits one block's text into strings, links and emphasis. Markers do not nest. */
export function inlineProse(text: string): ComponentChildren[] {
  const out: ComponentChildren[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > at) out.push(text.slice(at, start));
    if (m[1] !== undefined) out.push(<ProseLink target={m[2]}>{m[1]}</ProseLink>);
    else if (m[3] !== undefined) out.push(<strong>{m[3]}</strong>);
    else out.push(<em>{m[4]}</em>);
    at = start + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/** An in-app path gets the Pages base; anything with a scheme opens in a new tab. */
function ProseLink({ target, children }: { target: string; children: ComponentChildren }) {
  if (target.startsWith('/')) return <a href={href(target as `/${string}`)}>{children}</a>;
  return (
    <a href={target} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

/** Renders a catalogue Markdown file. The file's `#` heading is the page's own h1. */
export function Prose({ markdown }: { markdown: string }) {
  return (
    <div class="prose">
      {parseProse(markdown).map((block, i) => {
        switch (block.kind) {
          case 'h1':
            return <h1 key={i}>{inlineProse(block.text)}</h1>;
          case 'h2':
            return <h2 key={i}>{inlineProse(block.text)}</h2>;
          case 'p':
            return <p key={i}>{inlineProse(block.text)}</p>;
          case 'ul':
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{inlineProse(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{inlineProse(item)}</li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
