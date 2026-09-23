import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { App } from '../app';
import { CHECKLIST } from '../content/mastery';
import { resetMasteryForTests } from '../progress/store';
import { Library } from './library';

function renderAt(pathname: string) {
  window.history.replaceState(null, '', pathname);
  return render(<App />);
}

/** The setting sections of the hymn page, in content order (gr-pl4, en-pl4-simple). */
function settings() {
  return screen.getAllByRole('region');
}

describe('Mastery', () => {
  it('keeps ticks per setting across a reload, and the Library filter follows them', async () => {
    const page = renderAt('/psaltis/library/holy-holy-holy');
    await waitFor(() => expect(settings().length).toBe(2));
    const greek = settings()[0];

    // Tick every *by ear* item and one *by notation* item on the Greek setting.
    const ear = within(greek).getByRole('group', { name: /By ear/ });
    for (const box of within(ear).getAllByRole('checkbox')) fireEvent.click(box);
    fireEvent.click(within(within(greek).getByRole('group', { name: /By notation/ })).getAllByRole('checkbox')[0]);
    expect(within(ear).getByText(/declared/)).toBeDefined();

    // A reload: forget memory, render again, and read back from IndexedDB.
    page.unmount();
    resetMasteryForTests();
    renderAt('/psaltis/library/holy-holy-holy');
    await waitFor(() => {
      const boxes = within(settings()[0]).getAllByRole('checkbox') as HTMLInputElement[];
      expect(boxes.filter((b) => b.checked).length).toBe(CHECKLIST.ear.items.length + 1);
    });
    // The English setting is untouched.
    const englishBoxes = within(settings()[1]).getAllByRole('checkbox') as HTMLInputElement[];
    expect(englishBoxes.some((b) => b.checked)).toBe(false);

    // Library: two indicators per setting; the filter sees *declared* and *in progress*.
    render(<Library />);
    await waitFor(() => expect(screen.getByText(/by ear: declared/)).toBeDefined());
    expect(screen.getByText(/by notation: in progress/)).toBeDefined();
    const status = screen.getAllByRole('combobox')[2];
    for (const s of ['declared', 'in progress', 'not started']) {
      fireEvent.change(status, { target: { value: s } });
      expect(screen.getByRole('link', { name: /Holy, holy, holy/ })).toBeDefined();
    }
  });
});
