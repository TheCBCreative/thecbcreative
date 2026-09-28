import type { ReactNode } from 'react';

// Shared underline style for inputs and the message box: the line darkens and thickens on focus, turns rust in error.
export const fieldInput =
  'mt-1 w-full border-b border-pine/(--opacity-input-line) bg-transparent py-2 text-body text-pine outline-none transition-[border-color,box-shadow] duration-(--duration-link-underline) focus:border-pine focus:shadow-field-focus aria-invalid:border-error-text aria-invalid:shadow-field-error motion-reduce:transition-none';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// A visible label above an underlined input (no placeholder-only fields), with its error below.
export function Field({ id, label, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-label text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
