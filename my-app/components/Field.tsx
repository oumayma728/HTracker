import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

/** A labelled text-style input. Pass any normal input props (name, type, defaultValue, ...). */
export function Field({ id, label, ...input }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="input" {...input} />
    </div>
  );
}
