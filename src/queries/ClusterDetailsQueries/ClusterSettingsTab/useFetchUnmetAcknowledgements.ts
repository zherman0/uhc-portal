import { useMutation } from '@tanstack/react-query';

import { getErrorDetailRowKey } from '~/components/clusters/common/Upgrades/UpgradeWizard/upgradeWizardHelper';
import { formatErrorData } from '~/queries/helpers';
import { getClusterService, getClusterServiceForRegion } from '~/services/clusterService';
import { UpgradePolicy } from '~/types/clusters_mgmt.v1';
import { ErrorState } from '~/types/types';

import { refetchSchedules } from './useGetSchedules';

/* ******************************************
  This hook is used to fetch the unmet acknowledgements for a cluster using the upgrade_policies API.
  This API call is different than anything else in the code base as we include the dryRun flag
  on a POST call and the results are different:  
  1) If there are no version gates, we get a 200 success response with no data.
  2) If there are version gates, we get a 400 error response with the version gates in the error details.
  We then need to get the VersionGates from the error details and return them in the data property.
  ****************************************** */
export const useFetchUnmetAcknowledgements = (
  clusterID: string,
  isHypershift: boolean,
  region?: string,
) => {
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

    // If we made it here, we have non-version-gate error(s)
    // and the error details are a flat object with `reason`, or as a wrapper like `{ validation_error_N: { reason, details, timestamp } }`.
    if (getErrorDetailRowKey(errorDetails?.[0], 0) === 'Error_Key') {
      const errorDetail: Pick<ErrorState, 'reason'> = {
        reason: formattedError?.error?.reason ?? '',
      };
      if (formattedError.error?.errorDetails) {
        // delete what is in the errorDetails[0] and replace it with the new errorDetail
        delete formattedError.error.errorDetails[0];
        formattedError.error.errorDetails[0] = { kind: 'Error', ...errorDetail };
      }
    }

    return {
      data: [],
      hasAllVersionGates: false,
      isPending,
      isSuccess,
      isError,
      error: formattedError.error,
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
