import { AXES, axisStatus, CHECKLIST } from '../content/mastery';
import { masteryKey, setTick, ticksOf, useMastery } from '../progress/store';

/** A setting's two self-declared checklists. Checkboxes and the day each was ticked, nothing more. */
export function MasteryChecklists({ hymnId, settingId }: { hymnId: string; settingId: string }) {
  const { persistent } = useMastery();
  const key = masteryKey(hymnId, settingId);
  const ticks = ticksOf(key);

  return (
    <div class="mastery">
      {AXES.map((axis) => {
        const list = CHECKLIST[axis];
        return (
          <fieldset key={axis} class="mastery__axis">
            <legend>
              {list.title} <span class="hint-text">— {axisStatus(ticks, axis)}</span>
            </legend>
            <p class="hint-text mastery__gloss">{list.gloss}</p>
            {list.items.map((item) => {
              const on = ticks[axis][item.id];
              return (
                <label key={item.id} class="mastery__item">
                  <input
                    type="checkbox"
                    checked={Boolean(on)}
                    onChange={(e) => setTick(key, axis, item.id, e.currentTarget.checked)}
                  />
                  <span>
                    {item.text}
                    {on && <span class="hint-text mastery__date"> ({on})</span>}
                  </span>
                </label>
              );
            })}
          </fieldset>
        );
      })}
      {!persistent && <p class="hint-text">This browser is not keeping progress; ticks last until you leave.</p>}
    </div>
  );
}
