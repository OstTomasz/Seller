interface FieldContainerProps {
  id?: string;
  label?: string;
  error?: string;
  hideErrorSpace?: boolean;
  children: React.ReactNode;
}

export const FieldContainer = ({
  id,
  label,
  error,
  hideErrorSpace = false,
  children,
}: FieldContainerProps) => {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col">
      {label ? (
        <label htmlFor={id} className="text-sm text-celery-300 mb-1.5 block">
          {label}
        </label>
      ) : null}
      {children}
      {hideErrorSpace ? null : (
        <span id={errorId} role="alert" className="text-xs text-error min-h-4 mt-1">
          {error ? error : null}
        </span>
      )}
    </div>
  );
};
