const VALIDATION_ERROR_KEY = /^validation_error_\d+$/;

const sortValidationKeys = (a: string, b: string) =>
  Number(a.replace(/^validation_error_/, '')) - Number(b.replace(/^validation_error_/, ''));

const isPlainDetailObject = (detail: unknown): detail is Record<string, unknown> =>
  Boolean(detail && typeof detail === 'object' && !Array.isArray(detail));

/**
 * Upgrade dry-run `details` may use one array element with many `validation_error_N` keys.
 * Flatten to one array element per key so UI can `errorDetails.map(...)` once per alert.
 */
export const flattenUnmetAcknowledgementErrorDetails = (
  details: unknown[] | undefined,
): unknown[] => {
  if (!details?.length) {
    return [];
  }
  return details.flatMap((detail) => {
    if (!isPlainDetailObject(detail)) {
      return [];
    }
    const validationKeys = Object.keys(detail).filter((k) => VALIDATION_ERROR_KEY.test(k));
    if (validationKeys.length > 1) {
      return validationKeys.sort(sortValidationKeys).map((k) => ({ [k]: detail[k] }));
    }
    return [detail];
  });
};
