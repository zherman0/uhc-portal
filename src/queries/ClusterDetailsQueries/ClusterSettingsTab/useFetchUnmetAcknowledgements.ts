import { useMutation } from '@tanstack/react-query';

import { AGGREGATE_UPGRADE_VALIDATION_ERRORS } from '~/queries/featureGates/featureConstants';
import { useFeatureGate } from '~/queries/featureGates/useFetchFeatureGate';
import { formatErrorData } from '~/queries/helpers';
import { getClusterService, getClusterServiceForRegion } from '~/services/clusterService';
import { UpgradePolicy } from '~/types/clusters_mgmt.v1';
import { ErrorState } from '~/types/types';

import { resolveUnmetAcknowledgementErrorDetailsForUi } from './unmetAcknowledgementErrorDetails';
import { refetchSchedules } from './useGetSchedules';

/* ******************************************
  This hook is used to fetch the unmet acknowledgements for a cluster using the upgrade_policies API.
  This API call is different than anything else in the code base as we include the dryRun flag
  on a POST call and the results are different:
  1) If there are no version gates, we get a 200 success response with no data.
  2) If there are version gates, we get a 400 error response with the version gates in the error details.
  We then need to get the VersionGates from the error details and return them in the data property.

  For other errors, dry-run `details` follow one of two shapes (see `unmetAcknowledgementErrorDetails`):
  non-aggregated (Error_Key rows + message on top-level `reason`) vs aggregated (nested validation_error_N).
  AGGREGATE_UPGRADE_VALIDATION_ERRORS selects which branch runs.
  ****************************************** */
export const useFetchUnmetAcknowledgements = (
  clusterID: string,
  isHypershift: boolean,
  region?: string,
) => {
  const aggregateUpgradeValidationErrors = useFeatureGate(AGGREGATE_UPGRADE_VALIDATION_ERRORS);

  const { isPending, isError, error, isSuccess, mutate } = useMutation({
    mutationKey: ['fetchUnmetAcknowledgements', clusterID],
    mutationFn: async (schedule: UpgradePolicy) => {
      const clusterService = region ? getClusterServiceForRegion(region) : getClusterService();
      const requestPost = isHypershift
        ? clusterService.postControlPlaneUpgradeSchedule
        : clusterService.postUpgradeSchedule;

      const response = requestPost(clusterID, schedule, true); // run with dryRun=true

      return response;
    },
    onSuccess: () => {
      refetchSchedules();
    },
  });
  if (isError) {
    const formattedError = formatErrorData(isPending, isError, error);
    const errorDetails = formattedError?.error?.errorDetails ?? [];

    const hasAllVersionGates =
      errorDetails.length > 0 && errorDetails.every((detail) => detail?.kind === 'VersionGate');

    if (hasAllVersionGates) {
      return {
        data: errorDetails,
        hasAllVersionGates,
        isPending,
        isSuccess: true,
        isError: false,
        error: null,
        mutate,
      };
    }

    const normalizedErrorDetails = resolveUnmetAcknowledgementErrorDetailsForUi(
      aggregateUpgradeValidationErrors,
      errorDetails,
      formattedError.error?.reason ?? '',
    );

    const errorForUi: ErrorState | null = formattedError.error
      ? ({
          ...formattedError.error,
          errorDetails: normalizedErrorDetails,
        } as ErrorState)
      : null;

    return {
      data: [],
      hasAllVersionGates: false,
      isPending,
      isSuccess,
      isError,
      error: errorForUi,
      mutate,
    };
  }

  // 200 success response
  return {
    data: [],
    isPending,
    isSuccess,
    isError: false,
    error,
    hasAllVersionGates: false,
    mutate,
  };
};
