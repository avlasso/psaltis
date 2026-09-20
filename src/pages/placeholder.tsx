import type { ComponentChildren } from 'preact';
import { ArrowLeft } from 'lucide-preact';
import { href } from '../routes';

/** A route that exists so links have somewhere to go; a later work item fills it. */
export function Placeholder({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <main class="page">
      <a class="back" href={href('/')}>
        <ArrowLeft aria-hidden="true" />
        Home
      </a>
      <h1>{title}</h1>
      <p>{children}</p>
    </main>
  );
}
