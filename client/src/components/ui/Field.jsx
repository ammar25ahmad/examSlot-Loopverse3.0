import { forwardRef, useId } from 'react';

export function Field({ label, error, hint, required, children, htmlFor }) {
  return (
    <div className="w-full">
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs muted">{hint}</p>
      ) : null}
    </div>
  );
}

const Control = (As) =>
  forwardRef(function ControlRef({ label, error, hint, required, className = '', ...props }, ref) {
    const id = useId();
    const inputId = props.id || id;
    return (
      <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
        <As ref={ref} id={inputId} className={`input ${error ? 'border-rose-400 focus:ring-rose-400/30' : ''} ${className}`} {...props} />
      </Field>
    );
  });

export const Input = Control('input');
export const Textarea = Control('textarea');
export const Select = forwardRef(function SelectRef(
  { label, error, hint, required, children, className = '', ...props },
  ref
) {
  const id = useId();
  const inputId = props.id || id;
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
      <select ref={ref} id={inputId} className={`input ${error ? 'border-rose-400' : ''} ${className}`} {...props}>
        {children}
      </select>
    </Field>
  );
});

export default Field;
