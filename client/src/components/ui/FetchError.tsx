export const FetchError = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center justify-center py-20 text-error">Failed to load {label}</div>
  );
};
