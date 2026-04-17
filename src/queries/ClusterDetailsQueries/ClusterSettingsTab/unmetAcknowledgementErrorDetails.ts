/**
 * Normalization for upgrade dry-run `error.details` from POST upgrade_policies (dryRun).
 * Two stable shapes (see `__fixtures__/upgrade_policies.json`: `nonAggregatedXhr` vs `aggregatedValidation`):
 *
 * - **Non-aggregated**: `details` is `[{ Error_Key: string }]`; the human message is only on the
 *   error object’s top-level `reason`. We copy that onto each detail row for the UI.
 * - **Aggregated**: each `details[i]` is either one validation wrapper (`aggregatedValidation`) or one
 *   object with several `validation_error_*` keys. When there is more than one such key, we map to
 *   those values so the alert can list each validation separately.
 */

const mergeTopLevelReasonIntoErrorKeyRow = (detail: unknown, topLevelReason: string): unknown => {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return detail;
  }
  const d = detail as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(d, 'Error_Key') || typeof d.reason === 'string') {
    return detail;
  }
  return {
    ...d,
    kind: 'Error',
    reason: topLevelReason,
  };
};

/**
 * @param useAggregatedShape — `true` when `AGGREGATE_UPGRADE_VALIDATION_ERRORS` is enabled (aggregated API).
 * @param details — `error.details` from the clusters-mgmt error payload (via formatErrorData).
 * @param topLevelReason — error `reason` string (only used for non-aggregated shape).
 */
export const resolveUnmetAcknowledgementErrorDetailsForUi = (
  useAggregatedShape: boolean,
  details: unknown[] | undefined,
  topLevelReason: string,
): unknown[] => {
  if (!details?.length) {
    return [];
  }
  if (useAggregatedShape) {
    // flatMap: bundled `validation_error_*` keys → one list row per payload.
    return details.flatMap((detail) => {
      if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
        return [detail];
      }
      const record = detail as Record<string, unknown>;
      const validationEntries = Object.entries(record).filter(([key]) =>
        key.startsWith('validation_error_'),
      );

      if (validationEntries.length > 1) {
        return validationEntries.map(([, value]) => value);
      }

      return [detail];
    });
  }
  return details.map((detail) => mergeTopLevelReasonIntoErrorKeyRow(detail, topLevelReason));
};
