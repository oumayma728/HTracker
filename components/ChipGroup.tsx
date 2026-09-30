import type { CSSProperties } from "react";

type Option = { value: string; label: string };

/** A group of pill choices built on native radio inputs (no client JS needed). */
export function ChipGroup({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: Option[];
  defaultValue: string;
}) {
  return (
    <fieldset className="field">
      <legend className="label">{legend}</legend>
      <div className="chips">
        {options.map((o) => (
          <label key={o.value} className="chip">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type Swatch = { value: string; label: string; hex: string };

/** Color picker made of radio inputs shown as circles. */
export function SwatchGroup({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: Swatch[];
  defaultValue: string;
}) {
  return (
    <fieldset className="field">
      <legend className="label">{legend}</legend>
      <div className="swatches">
        {options.map((o) => (
          <label key={o.value} className="swatch">
            <input
              type="radio"
              name={name}
              value={o.value}
              aria-label={o.label}
              defaultChecked={o.value === defaultValue}
            />
            <span style={{ "--swatch": o.hex } as CSSProperties} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
