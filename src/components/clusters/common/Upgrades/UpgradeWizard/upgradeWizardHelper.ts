/** React list key: first own property name plus index so duplicate-shaped details stay unique. */
export const getErrorDetailRowKey = (detail: unknown, index: number): string => {
  const keys = Object.keys(
    typeof detail === 'object' && detail !== null && !Array.isArray(detail) ? detail : {},
  );
  const baseKey = keys[0] ?? String(index);
  return `${baseKey}-${index}`;
};

/**
 * Dry-run / unmet acknowledgement errors sometimes return `errorDetails` items as a flat object
 * with `reason`, or as a wrapper like `{ validation_error_1: { reason, details, timestamp } }`.
 */
export const getErrorDetailReasonMessage = (detail: unknown): string | undefined => {
  if (!detail || typeof detail !== 'object') {
    return undefined;
  }
  const record = detail as Record<string, unknown>;
  if (typeof record.reason === 'string') {
    return record.reason;
  }
  const nestedReasons = Object.values(record)
    .filter((value): value is { reason: string } =>
      Boolean(
        value &&
          typeof value === 'object' &&
          typeof (value as { reason?: unknown }).reason === 'string',
      ),
    )
    .map((value) => value.reason);
  return nestedReasons.length > 0 ? nestedReasons.join('\n') : undefined;
};
