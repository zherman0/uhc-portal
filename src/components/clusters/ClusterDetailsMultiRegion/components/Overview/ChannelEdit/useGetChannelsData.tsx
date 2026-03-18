import { isHypershiftCluster, isROSA } from '~/components/clusters/common/clusterStates';
import { hasUnstableVersionsCapability } from '~/components/clusters/wizards/common/ClusterSettings/Details/versionSelectHelper';
import { GCPAuthType } from '~/components/clusters/wizards/osd/ClusterSettings/CloudProvider/types';
import { useFetchInstallableVersions } from '~/queries/ClusterDetailsQueries/useFetchInstallableVersions';
import { UNSTABLE_CLUSTER_VERSIONS } from '~/queries/featureGates/featureConstants';
import { useFeatureGate } from '~/queries/featureGates/useFetchFeatureGate';
import { useGlobalState } from '~/redux/hooks';
import { SubscriptionCommonFieldsCluster_billing_model as SubscriptionCommonFieldsClusterBillingModel } from '~/types/accounts_mgmt.v1';
import { Cluster } from '~/types/clusters_mgmt.v1';

type VersionWithChannels = { raw_id?: string; available_channels?: string[] };

export const useGetChannelsData = (cluster: Cluster, canEdit: boolean) => {
  const isRosa = isROSA(cluster);
  const isHCP = isHypershiftCluster(cluster);
  const isMarketplaceGcp =
    cluster.billing_model === SubscriptionCommonFieldsClusterBillingModel.marketplace_gcp;
  const isWIF = cluster.gcp?.authentication?.id === GCPAuthType.WorkloadIdentityFederation;
  const organization = useGlobalState((state) => state.userProfile.organization.details);
  const unstableOCPVersionsEnabled =
    useFeatureGate(UNSTABLE_CLUSTER_VERSIONS) && hasUnstableVersionsCapability(organization);

  const { data, isLoading } = useFetchInstallableVersions({
    isRosa,
    isMarketplaceGcp,
    isWIF,
    isHCP,
    includeUnstableVersions: unstableOCPVersionsEnabled,
    canEdit,
  });
  const clusterRawId = cluster.version?.raw_id;

  const availableChannels = (
    versionsData: { items?: VersionWithChannels[] } | undefined,
    rawId?: string,
  ): { value: string; label: string }[] => {
    const items = versionsData?.items ?? [];
    const topLevelChannels = (versionsData as { available_channels?: string[] })
      ?.available_channels;
    if (topLevelChannels?.length) {
      return topLevelChannels.map((channel) => ({ value: channel, label: channel }));
    }
    const matchingVersion = rawId
      ? items.find((el: VersionWithChannels) => el.raw_id === rawId)
      : items[0];
    const channels = matchingVersion?.available_channels ?? [];
    return channels.map((channel) => ({ value: channel, label: channel }));
  };

  const availableDropdownChannels = availableChannels(data, clusterRawId);
  return { availableDropdownChannels, isLoading };
};
