import { useId } from "react";

/**
 * Labelled form control with an optional hint and error message.
 * The control is linked to both texts through aria-describedby, and
 * aria-invalid is set whenever an error is shown.
 *
 * Pass `children` as a render function receiving the accessibility props,
 * or omit it to render a plain <input>.
 */
export default function FormField({
  label,
  hint,
  error,
  optional = false,
  children,
  ...inputProps
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  const controlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? "true" : "false",
  };

  return (
    <div className={`field${error ? " field-invalid" : ""}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="optional"> (optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {children ? (
        children(controlProps)
      ) : (
        <input {...controlProps} {...inputProps} />
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
