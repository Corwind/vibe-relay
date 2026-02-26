interface ConnectionErrorProps {
  error: string | null;
}

export function ConnectionError({ error }: ConnectionErrorProps) {
  if (!error) return null;

  return (
    <div
      data-testid="connection-error"
      className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error}
    </div>
  );
}
