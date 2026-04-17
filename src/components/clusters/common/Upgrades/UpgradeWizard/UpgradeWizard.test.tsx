import React from 'react';
import * as reactRedux from 'react-redux';

import { useFetchUnmetAcknowledgements } from '~/queries/ClusterDetailsQueries/ClusterSettingsTab/useFetchUnmetAcknowledgements';
import { refetchSchedules } from '~/queries/ClusterDetailsQueries/ClusterSettingsTab/useGetSchedules';
import { usePostClusterGateAgreementAcknowledgeModal } from '~/queries/ClusterDetailsQueries/ClusterSettingsTab/usePostClusterGateAgreement';
import { usePostSchedule } from '~/queries/ClusterDetailsQueries/ClusterSettingsTab/usePostSchedule';
import { checkAccessibility, screen, waitFor, withState } from '~/testUtils';
import { AugmentedCluster } from '~/types/types';

import { useFetchClusterDetails } from '../../../../../queries/ClusterDetailsQueries/useFetchClusterDetails';
import fixtures from '../../../ClusterDetailsMultiRegion/__tests__/ClusterDetails.fixtures';

import UpgradeWizard from './UpgradeWizard';

jest.mock('react-redux', () => ({
  __esModule: true,
  ...jest.requireActual('react-redux'),
}));

jest.mock('../../../../../queries/ClusterDetailsQueries/useFetchClusterDetails', () => ({
  useFetchClusterDetails: jest.fn(),
  invalidateClusterDetailsQueries: jest.fn(),
}));

jest.mock(
  '~/queries/ClusterDetailsQueries/ClusterSettingsTab/useFetchUnmetAcknowledgements',
  () => ({
    useFetchUnmetAcknowledgements: jest.fn(),
  }),
);

jest.mock('~/queries/ClusterDetailsQueries/ClusterSettingsTab/usePostSchedule', () => ({
  usePostSchedule: jest.fn(),
}));

jest.mock('~/queries/ClusterDetailsQueries/ClusterSettingsTab/usePostClusterGateAgreement', () => ({
  usePostClusterGateAgreementAcknowledgeModal: jest.fn(),
}));

jest.mock('~/queries/ClusterDetailsQueries/ClusterSettingsTab/useGetSchedules', () => ({
  refetchSchedules: jest.fn(),
}));

interface InitialState {
  modal: {
    data: {
      clusterName: string;
      subscriptionID: string;
    };
  };
}

interface ClusterDetailsResponse {
  isLoading: boolean;
  isSuccess?: boolean;
  cluster?: AugmentedCluster;
  isError?: boolean;
  error?: Error | null;
  isFetching: boolean;
}

/** Must match `fixtures.clusterDetails.cluster.subscription.id` or the wizard stays pending. */
const MATCHING_SUBSCRIPTION_ID = '1msoogsgTLQ4PePjrTOt3UqvMzX';

const useFetchUnmetAcknowledgementsMock = useFetchUnmetAcknowledgements as jest.Mock;
const usePostScheduleMock = usePostSchedule as jest.Mock;
const usePostClusterGateAgreementMock = usePostClusterGateAgreementAcknowledgeModal as jest.Mock;

describe('<UpgradeWizard />', () => {
  const useDispatchMock = jest.spyOn(reactRedux, 'useDispatch');
  const mockedDispatch = jest.fn();
  useDispatchMock.mockReturnValue(mockedDispatch);
  const mockedUseFetchClusterDetails = useFetchClusterDetails as jest.Mock;

  const unmetMutate = jest.fn();
  const postScheduleMutate = jest.fn();
  const postGateMutateAsync = jest.fn().mockResolvedValue(undefined);

  const initialState: InitialState = {
    modal: {
      data: {
        clusterName: 'myClusterName',
        subscriptionID: MATCHING_SUBSCRIPTION_ID,
      },
    },
  };

  const clusterWithUpgrades = {
    ...fixtures.clusterDetails.cluster,
    version: {
      ...fixtures.clusterDetails.cluster.version,
      available_upgrades: ['4.6.9', '4.7.0'],
    },
  } as unknown as AugmentedCluster;

  const defaultClusterDetailsResponse: ClusterDetailsResponse = {
    isLoading: false,
    isSuccess: true,
    cluster: clusterWithUpgrades,
    isError: false,
    error: null,
    isFetching: false,
  };

  const defaultUnmetResponse = {
    data: [] as unknown[],
    hasAllVersionGates: false,
    mutate: unmetMutate,
    isError: false,
    isPending: false,
    isSuccess: true,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    postGateMutateAsync.mockResolvedValue(undefined);
    useFetchUnmetAcknowledgementsMock.mockReturnValue(defaultUnmetResponse);
    usePostScheduleMock.mockReturnValue({
      mutate: postScheduleMutate,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
    });
    usePostClusterGateAgreementMock.mockReturnValue({
      mutateAsync: postGateMutateAsync,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is accessible', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { container } = withState(initialState, true).render(<UpgradeWizard />);

    await checkAccessibility(container);
  });

  it('displays spinner when loading', async () => {
    mockedUseFetchClusterDetails.mockReturnValue({
      isLoading: true,
      isSuccess: undefined,
      cluster: undefined,
    });

    withState(initialState, true).render(<UpgradeWizard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays the cluster name', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);

    withState(initialState, true).render(<UpgradeWizard />);

    expect(screen.getByText('myClusterName')).toBeInTheDocument();
  });

  it('calls close modal when cancelling', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);

    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    expect(mockedDispatch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockedDispatch.mock.calls[0][0].type).toEqual('CLOSE_MODAL');
  });

  it('Next is disabled when no version is selected', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);

    withState(initialState, true).render(<UpgradeWizard />);

    const nextButton = screen.getByRole('button', { name: 'Next' });

    await waitFor(() => {
      expect(nextButton).toBeInTheDocument();
    });

    expect(nextButton).toBeDisabled();
  });

  it('displays the appropriate steps', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);

    withState(initialState, true).render(<UpgradeWizard />);

    expect(screen.getByRole('button', { name: 'Select version' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule update' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmation' })).toBeInTheDocument();
  });

  it('shows version grid after cluster details load (not stuck pending on subscription mismatch)', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    withState(initialState, true).render(<UpgradeWizard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar', { name: 'Loading...' })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Select version').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4.7.0')).toBeInTheDocument();
  });

  it('calls unmet acknowledgements mutate when user selects a version', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('4.7.0');
    await user.click(screen.getByText('4.7.0'));

    await waitFor(() => {
      expect(unmetMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '4.7.0',
          schedule_type: 'manual',
        }),
      );
    });
  });

  it('shows unmet acknowledgements error alert when dry-run fails with details', async () => {
    useFetchUnmetAcknowledgementsMock.mockReturnValue({
      ...defaultUnmetResponse,
      isError: true,
      isSuccess: false,
      error: {
        errorDetails: [{ reason: 'Cannot upgrade while gates are open' }],
        errorMessage: 'Bad request',
      },
    });
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('A problem occurred with that selected version');
    expect(screen.getByText('Cannot upgrade while gates are open')).toBeInTheDocument();
  });

  it('shows Administrator acknowledgement step when version gates apply', async () => {
    useFetchUnmetAcknowledgementsMock.mockReturnValue({
      ...defaultUnmetResponse,
      hasAllVersionGates: true,
      data: [{ kind: 'VersionGate', id: 'gate-1' }],
    });
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('4.7.0');
    await user.click(screen.getByText('4.7.0'));

    expect(
      await screen.findByRole('button', { name: 'Administrator acknowledgement' }),
    ).toBeInTheDocument();
  });

  it('submits schedule after confirming on review step', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('4.7.0');
    await user.click(screen.getByText('4.7.0'));

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    await waitFor(() => expect(nextBtn).not.toBeDisabled());
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Schedule update' })).toHaveAttribute(
        'aria-current',
        'step',
      );
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Confirmation of your update')).toBeInTheDocument();
    expect(screen.getByText(/4\.6\.8/)).toBeInTheDocument();
    expect(screen.getByText(/4\.7\.0/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm update' }));

    await waitFor(() => {
      expect(postGateMutateAsync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(postScheduleMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '4.7.0',
          schedule_type: 'manual',
        }),
      );
    });
  });

  it('shows finished step with success when schedule mutation reports success', async () => {
    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('4.7.0');
    await user.click(screen.getByText('4.7.0'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled());
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Confirmation of your update')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm update' }));

    expect(await screen.findByText('Scheduled cluster update')).toBeInTheDocument();
  });

  it('refetches schedules and invalidates cluster details when modal closes after completion', async () => {
    const { invalidateClusterDetailsQueries } = jest.requireMock(
      '../../../../../queries/ClusterDetailsQueries/useFetchClusterDetails',
    ) as { invalidateClusterDetailsQueries: jest.Mock };

    mockedUseFetchClusterDetails.mockReturnValue(defaultClusterDetailsResponse);
    const { user } = withState(initialState, true).render(<UpgradeWizard />);

    await screen.findByText('4.7.0');
    await user.click(screen.getByText('4.7.0'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled());
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Confirm update' }));

    await screen.findByText('Scheduled cluster update');

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    const emptyStateClose = closeButtons.find((el) => el.classList.contains('pf-m-primary'));
    expect(emptyStateClose).toBeTruthy();
    await user.click(emptyStateClose!);

    expect(refetchSchedules).toHaveBeenCalled();
    expect(invalidateClusterDetailsQueries).toHaveBeenCalled();
    expect(mockedDispatch.mock.calls.some((c) => c[0].type === 'CLOSE_MODAL')).toBe(true);
  });
});
