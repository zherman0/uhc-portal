import axios, { type AxiosError } from 'axios';

import { AGGREGATE_UPGRADE_VALIDATION_ERRORS } from '~/queries/featureGates/featureConstants';
import { formatErrorData } from '~/queries/helpers';
import { getClusterService, getClusterServiceForRegion } from '~/services/clusterService';
import { mockUseFeatureGate, renderHook, waitFor } from '~/testUtils';
import type { UpgradePolicy } from '~/types/clusters_mgmt.v1';

import upgradePolicies from './__fixtures__/upgrade_policies.json';
import { resolveUnmetAcknowledgementErrorDetailsForUi } from './unmetAcknowledgementErrorDetails';
import { useFetchUnmetAcknowledgements } from './useFetchUnmetAcknowledgements';
import { refetchSchedules } from './useGetSchedules';

jest.mock('./useGetSchedules', () => ({
  refetchSchedules: jest.fn(),
}));

jest.mock('~/services/clusterService', () => ({
  getClusterService: jest.fn(),
  getClusterServiceForRegion: jest.fn(),
}));

type ClustersMgmtErrorBody = (typeof upgradePolicies)[keyof typeof upgradePolicies];

/**
 * Dry-run POST returns HTTP 400 with a clusters-mgmt `Error` JSON body in `response.data`.
 */
function dryRunHttp400AxiosError(errorBody: ClustersMgmtErrorBody): AxiosError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    code: '400',
    response: {
      status: 400,
      data: errorBody,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    },
  } as unknown as AxiosError;
}

const schedulePayload: UpgradePolicy = {
  version: '4.14.0',
  schedule_type: 'manual',
  upgrade_type: 'OSD',
  next_run: new Date().toISOString(),
};

describe('useFetchUnmetAcknowledgements', () => {
  const postUpgradeSchedule = jest.fn();
  const postControlPlaneUpgradeSchedule = jest.fn();

  /** Fixtures must round-trip through `formatErrorData`; also forces helpers to load before JSON + hook (stable `isAxiosError` under ts-jest). */
  it('upgrade_policies.json versionGatesOnly is a valid dry-run error body', () => {
    const body = upgradePolicies.versionGatesOnly;
    const err = dryRunHttp400AxiosError(body);
    expect(axios.isAxiosError(err)).toBe(true);
    expect(formatErrorData(false, true, err).error?.errorDetails).toEqual(body.details);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureGate([]);
    postUpgradeSchedule.mockResolvedValue({});
    (getClusterService as jest.Mock).mockReturnValue({
      postUpgradeSchedule,
      postControlPlaneUpgradeSchedule,
    });
  });

  it('exposes empty data and no gates before mutate (mutation idle)', () => {
    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    expect(result.current.data).toEqual([]);
    expect(result.current.hasAllVersionGates).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isPending).toBe(false);
  });

  it('calls postUpgradeSchedule with dryRun and refetches schedules on success', async () => {
    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postUpgradeSchedule).toHaveBeenCalledWith('cluster-1', schedulePayload, true);
    expect(result.current.data).toEqual([]);
    expect(result.current.hasAllVersionGates).toBe(false);
    expect(refetchSchedules).toHaveBeenCalledTimes(1);
  });

  it('uses regional service when region is passed', async () => {
    (getClusterServiceForRegion as jest.Mock).mockReturnValue({ postUpgradeSchedule });

    const { result } = renderHook(() =>
      useFetchUnmetAcknowledgements('cluster-1', false, 'us-east-1'),
    );

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getClusterServiceForRegion).toHaveBeenCalledWith('us-east-1');
    expect(getClusterService).not.toHaveBeenCalled();
    expect(postUpgradeSchedule).toHaveBeenCalledWith('cluster-1', schedulePayload, true);
  });

  it('uses postControlPlaneUpgradeSchedule when cluster is hypershift', async () => {
    postControlPlaneUpgradeSchedule.mockResolvedValue({});

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', true));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postControlPlaneUpgradeSchedule).toHaveBeenCalledWith(
      'cluster-1',
      schedulePayload,
      true,
    );
    expect(postUpgradeSchedule).not.toHaveBeenCalled();
  });

  it('maps version-gate-only 400 details into data and hasAllVersionGates', async () => {
    const body = upgradePolicies.versionGatesOnly;
    postUpgradeSchedule.mockRejectedValueOnce(dryRunHttp400AxiosError(body));

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.hasAllVersionGates).toBe(true));

    expect(result.current.data).toEqual(body.details);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('treats mixed VersionGate and non-gate details as a normal validation error', async () => {
    const body = upgradePolicies.mixedVersionGateAndError;
    postUpgradeSchedule.mockRejectedValueOnce(dryRunHttp400AxiosError(body));

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.hasAllVersionGates).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error?.reason).toContain('Mixed VersionGate and non-gate');
  });

  it('normalizes non-gate errors with resolveUnmetAcknowledgementErrorDetailsForUi (real helper)', async () => {
    const body = upgradePolicies.nonAggregatedXhr;
    postUpgradeSchedule.mockRejectedValueOnce(dryRunHttp400AxiosError(body));

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const expectedDetails = resolveUnmetAcknowledgementErrorDetailsForUi(
      false,
      [...body.details],
      body.reason,
    );
    expect(result.current.error?.errorDetails).toEqual(expectedDetails);
  });

  it('passes aggregate feature gate into normalization (aggregated validation shape)', async () => {
    mockUseFeatureGate([[AGGREGATE_UPGRADE_VALIDATION_ERRORS, true]]);
    const body = upgradePolicies.aggregatedValidation;
    postUpgradeSchedule.mockRejectedValueOnce(dryRunHttp400AxiosError(body));

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const expectedDetails = resolveUnmetAcknowledgementErrorDetailsForUi(
      true,
      [...body.details],
      body.reason,
    );
    expect(result.current.error?.errorDetails).toEqual(expectedDetails);
  });

  it('forwards isPending while mutation is in flight', async () => {
    let resolvePost: (v: unknown) => void;
    const slowPost = jest.fn(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );
    (getClusterService as jest.Mock).mockReturnValue({ postUpgradeSchedule: slowPost });

    const { result } = renderHook(() => useFetchUnmetAcknowledgements('cluster-1', false));

    result.current.mutate(schedulePayload);

    await waitFor(() => expect(result.current.isPending).toBe(true));

    resolvePost!({});

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isSuccess).toBe(true);
  });
});
