const VALIDATION_ERROR_KEY = /^validation_error_\d+$/;

const sortValidationKeys = (a: string, b: string) =>
  Number(a.replace(/^validation_error_/, '')) - Number(b.replace(/^validation_error_/, ''));

const isPlainDetailObject = (detail: unknown): detail is Record<string, unknown> =>
  Boolean(detail && typeof detail === 'object' && !Array.isArray(detail));

/**
 * Legacy dry-run shape: `details[0]` is `{ Error_Key: '...' }` with the human text only on the
 * top-level error `reason`. Merge that into the detail so each row has `reason` for the UI.
 */
const mergeTopLevelReasonIntoErrorKeyDetail = (
  detail: Record<string, unknown>,
  topLevelReason: string,
): Record<string, unknown> => {
  const keys = Object.keys(detail);
  if (keys[0] !== 'Error_Key' || typeof detail.reason === 'string') {
    return detail;
  }
  return {
    ...detail,
    kind: 'Error',
    reason: topLevelReason,
  };
};

/**
 * Upgrade dry-run `details` may use one array element with many `validation_error_N` keys.
 * Flatten to one array element per key so UI can `errorDetails.map(...)` once per alert.
 *
 * @param topLevelReason — API sometimes puts the message on the error `reason` while `details`
 *   only contain `{ Error_Key: '...' }`; pass the formatted error `reason` so it is copied onto
 *   those detail rows.
 */
export const flattenUnmetAcknowledgementErrorDetails = (
  details: unknown[] | undefined,
  topLevelReason = '',
): unknown[] => {
  if (!details?.length) {
    return [];
  }
  return details
    .flatMap((detail) => {
      if (!isPlainDetailObject(detail)) {
        return [];
      }
      const validationKeys = Object.keys(detail).filter((k) => VALIDATION_ERROR_KEY.test(k));
      if (validationKeys.length > 1) {
        return validationKeys.sort(sortValidationKeys).map((k) => ({ [k]: detail[k] }));
      }
      return [detail];
    })
    .map((detail) =>
      isPlainDetailObject(detail)
        ? mergeTopLevelReasonIntoErrorKeyDetail(detail, topLevelReason)
        : detail,
    );
};
