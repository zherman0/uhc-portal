/**
 * Normalization for upgrade dry-run `error.details` from POST upgrade_policies (dryRun).
 * Two stable shapes (see upgrade_policies_xhr.json vs upgrade3.json):
 *
 * - **Non-aggregated**: `details` is `[{ Error_Key: string }]`; the human message is only on the
 *   error object’s top-level `reason`. We copy that onto each detail row for the UI.
 * - **Aggregated**: each `details[i]` is either one validation wrapper (`upgrade3.json`) or one
 *   object whose **values** are several validation payloads. For the bundled case we use
 *   `Object.values` + `flatMap` so the alert’s `map` gets one element per message (same as N
 *   separate `details` rows from the API).
 */

const mergeTopLevelReasonIntoErrorKeyRow = (detail: unknown, topLevelReason: string): unknown => {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return detail;
  }
  const d = detail as Record<string, unknown>;
  const keys = Object.keys(d);
  if (keys[0] !== 'Error_Key' || typeof d.reason === 'string') {
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
    // flatMap: each API row becomes one or many list rows (bundled validations → one row per value).
    return details.flatMap((detail) => {
      if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
        return [detail];
      }
      const values = Object.values(detail as Record<string, unknown>);
      return values.length > 1 ? values : [detail];
    });
  }
  return details.map((detail) => mergeTopLevelReasonIntoErrorKeyRow(detail, topLevelReason));
};
