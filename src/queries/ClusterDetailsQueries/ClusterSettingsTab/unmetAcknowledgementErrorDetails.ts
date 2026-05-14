/**
 * Normalization for upgrade dry-run `error.details` from POST upgrade_policies (dryRun).
 * Shapes are documented in `__fixtures__/upgrade_policies.json`:
 *
 * 1. **Version gates only** — handled in `useFetchUnmetAcknowledgements` before this module runs.
 * 2. **Non-aggregated** — `details` is `[{ Error_Key: string }]`, message only on the error’s top-level `reason`.
 * 3. **Aggregated** — each row is either a single `validation_error_N` wrapper or one object bundling several
 *    `validation_error_*` keys; multiple keys are expanded to one list item per nested payload.
 *
 * Bundled rows (more than one `validation_error_*` on a single object) are **always** expanded before the
 * non-aggregated merge step. `AGGREGATE_UPGRADE_VALIDATION_ERRORS` still selects aggregated vs non-aggregated
 * behavior for everything else, but the list UI needs one array element per validation so `UnmetAcknowledgementsErrorAlert`
 * can map over bullets even when the gate reads `false` (defaults false while loading).
 */

/** JSON subset used for API `details` rows (avoids `unknown` while staying compatible with axios payloads). */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type UpgradeDryRunAggregatedNestedDetail = {
  readonly Error_Key: string;
};

/** Inner payload under each `validation_error_N` key (aggregated shape). */
export type UpgradeDryRunAggregatedValidationPayload = {
  readonly reason: string;
  readonly details: readonly UpgradeDryRunAggregatedNestedDetail[];
  readonly timestamp: string;
};

/** Non-aggregated row after copying the parent error `reason` onto the row for the UI. */
export type NormalizedNonAggregatedErrorDetail = {
  readonly Error_Key: string;
  readonly kind: 'Error';
  readonly reason: string;
  readonly [extra: string]: JsonValue;
};

export type UnmetAcknowledgementUiErrorDetail = JsonValue;

const isJsonObject = (value: JsonValue): value is { readonly [key: string]: JsonValue } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidationErrorPropertyKey = (key: string): boolean => key.startsWith('validation_error_');

const getValidationErrorEntries = (record: {
  readonly [key: string]: JsonValue;
}): ReadonlyArray<readonly [string, JsonValue]> =>
  Object.entries(record).filter(([key]) => isValidationErrorPropertyKey(key));

const mergeTopLevelReasonIntoErrorKeyRow = (
  detail: JsonValue,
  topLevelReason: string,
): UnmetAcknowledgementUiErrorDetail => {
  if (!isJsonObject(detail)) {
    return detail;
  }
  if (
    !Object.prototype.hasOwnProperty.call(detail, 'Error_Key') ||
    typeof detail.Error_Key !== 'string'
  ) {
    return detail;
  }
  if (typeof detail.reason === 'string') {
    return detail;
  }
  const merged: NormalizedNonAggregatedErrorDetail = {
    ...detail,
    kind: 'Error',
    reason: topLevelReason,
    Error_Key: detail.Error_Key,
  };
  return merged;
};

const expandAggregatedDetailRow = (
  detail: JsonValue,
): readonly UnmetAcknowledgementUiErrorDetail[] => {
  if (!isJsonObject(detail)) {
    return [detail];
  }
  const validationEntries = getValidationErrorEntries(detail);

  if (validationEntries.length > 1) {
    return validationEntries.map(([, value]) => value);
  }

  return [detail];
};

/**
 * @param useAggregatedShape — `true` when `AGGREGATE_UPGRADE_VALIDATION_ERRORS` is enabled (aggregated API).
 * @param details — `error.details` from the clusters-mgmt error payload (via formatErrorData).
 * @param topLevelReason — error `reason` string (only used for non-aggregated shape).
 */
export const resolveUnmetAcknowledgementErrorDetailsForUi = (
  useAggregatedShape: boolean,
  details: readonly JsonValue[] | undefined,
  topLevelReason: string,
): readonly UnmetAcknowledgementUiErrorDetail[] => {
  if (!details?.length) {
    return [];
  }

  const expandedRows = details.flatMap((row) => expandAggregatedDetailRow(row));

  if (useAggregatedShape) {
    return expandedRows;
  }

  return expandedRows.map((row) => mergeTopLevelReasonIntoErrorKeyRow(row, topLevelReason));
};
