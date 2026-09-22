import { render, screen } from '@testing-library/preact';
import { parseProse, Prose } from './prose';

describe('parseProse', () => {
  it('reads headings, paragraphs and both kinds of list', () => {
    expect(
      parseProse('# Title\n\nA line\nwrapped over two.\n\n- one\n- two\n\n1. first\n2. second'),
    ).toEqual([
      { kind: 'h1', text: 'Title' },
      { kind: 'p', text: 'A line wrapped over two.' },
      { kind: 'ul', items: ['one', 'two'] },
      { kind: 'ol', items: ['first', 'second'] },
    ]);
  });

  it('joins a wrapped list item and starts a new list when the marker changes', () => {
    expect(parseProse('- one\n  still one\n1. a number')).toEqual([
      { kind: 'ul', items: ['one still one'] },
      { kind: 'ol', items: ['a number'] },
    ]);
  });
});

describe('Prose', () => {
  it('puts the base path on an in-app link and opens an external one in a tab', () => {
    render(<Prose markdown="Open [Pl. 4](/scales/pl4) or [the paper](https://example.org/p.pdf)." />);

    expect(screen.getByRole('link', { name: 'Pl. 4' }).getAttribute('href')).toBe('/psaltis/scales/pl4');
    const external = screen.getByRole('link', { name: 'the paper' });
    expect(external.getAttribute('href')).toBe('https://example.org/p.pdf');
    expect(external.getAttribute('target')).toBe('_blank');
  });

  it('renders emphasis and leaves an unsupported marker as written', () => {
    render(<Prose markdown="**bold** and *soft* and `code`" />);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('soft').tagName).toBe('EM');
    expect(document.body.textContent).toContain('`code`');
  });
});
