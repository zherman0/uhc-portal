import React from 'react';

import { render, screen, waitFor } from '~/testUtils';
import { ClusterWithPermissions } from '~/types/types';

import { useEditChannelOnCluster } from '../../../../../../queries/ChannelEditQueries/useEditChannelOnCluster';
import fixtures from '../../../__tests__/ClusterDetails.fixtures';

import { ChannelEdit } from './ChannelEdit';
import { useGetChannelsData } from './useGetChannelsData';

jest.mock('./useGetChannelsData');
jest.mock('../../../../../../queries/ChannelEditQueries/useEditChannelOnCluster');

jest.mock('~/components/common/ErrorBox', () => (props: { message?: string }) => {
  const { message } = props;
  return <div data-testid="error-box">{message}</div>;
});

jest.mock('./ChannelSelect', () => ({
  ChannelSelect: ({
    input,
    optionsDropdownData,
  }: {
    input: { value: string; onChange: (v: string) => void };
    optionsDropdownData: { value: string; label: string }[];
  }) => (
    <select
      data-testid="channel-select"
      value={input.value}
      onChange={(e) => input.onChange(e.target.value)}
    >
      {optionsDropdownData.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const mockUseGetChannelsData = useGetChannelsData as jest.Mock;
const mockUseEditChannelOnCluster = useEditChannelOnCluster as jest.Mock;

const mockOptions = [
  { value: 'stable-4.16', label: 'stable-4.16' },
  { value: 'eus-4.16', label: 'eus-4.16' },
];

describe('<ChannelEdit />', () => {
  let mutateMock: jest.Mock;

  const mockedROSAHyperShiftCluster = fixtures.ROSAHypershiftClusterDetails
    .cluster as unknown as ClusterWithPermissions;

  const mockedROSAHyperShiftWaitingCluster = fixtures.ROSAHypershiftWaitingClusterDetails
    .cluster as unknown as ClusterWithPermissions;

  beforeEach(() => {
    mutateMock = jest.fn();
    mockUseGetChannelsData.mockClear();
    mockUseEditChannelOnCluster.mockClear();

    mockUseEditChannelOnCluster.mockReturnValue({
      mutate: mutateMock,
      isError: false,
      error: null,
    });
  });

  it('Renders channel and loading label', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: undefined,
      isLoading: true,
    });
    render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('channelModal')).not.toBeInTheDocument();
  });

  it('should render the channel and an enabled edit button when not loading and editable', () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('stable-4.16')).toBeInTheDocument();
    const openModalButton = screen.getByTestId('channelModal');
    expect(openModalButton).toBeInTheDocument();
    expect(openModalButton).toBeEnabled();
  });

  it('should render a disabled edit button when cluster is not ready', () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    render(
      <ChannelEdit
        cluster={
          {
            ...mockedROSAHyperShiftWaitingCluster,
            channel: 'stable-4.16',
          } as ClusterWithPermissions
        }
      />,
    );

    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('stable-4.16')).toBeInTheDocument();
    const openModalButton = screen.getByTestId('channelModal');
    expect(openModalButton).toBeInTheDocument();
    expect(openModalButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should render N/A when channel is not provided', () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    render(
      <ChannelEdit
        cluster={{ ...mockedROSAHyperShiftCluster, channel: '' } as ClusterWithPermissions}
      />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should not render an edit button when available channels list is empty', () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: [],
      isLoading: false,
    });

    render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    expect(screen.getByText('stable-4.16')).toBeInTheDocument();
    expect(screen.queryByTestId('channelModal')).not.toBeInTheDocument();
  });

  it('should not render an edit button if cluster is not editable', () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    const nonEditableCluster = { ...mockedROSAHyperShiftCluster, canEdit: false };
    render(
      <ChannelEdit
        cluster={{ ...nonEditableCluster, channel: 'stable-4.16' } as ClusterWithPermissions}
      />,
    );

    const openModalButton = screen.queryByTestId('channelModal');
    expect(openModalButton).not.toBeInTheDocument();
  });

  it('should open the modal when the edit button is clicked', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    const { user } = render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    await user.click(screen.getByTestId('channelModal'));

    expect(screen.getByRole('dialog', { name: /edit channel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should close the modal when cancel button is clicked', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    const { user } = render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    await user.click(screen.getByTestId('channelModal'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should have a disabled save button initially in the modal', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    const { user } = render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    await user.click(screen.getByTestId('channelModal'));

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should call mutate with channel when save is clicked after changing selection', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });
    mockUseEditChannelOnCluster.mockReturnValue({
      mutate: mutateMock,
      isError: false,
      error: null,
      isPending: false,
    });

    const { user } = render(
      <ChannelEdit
        cluster={
          {
            ...mockedROSAHyperShiftCluster,
            channel: 'stable-4.16',
            id: 'cluster-123',
          } as ClusterWithPermissions
        }
      />,
    );

    await user.click(screen.getByTestId('channelModal'));
    await user.selectOptions(screen.getByTestId('channel-select'), 'eus-4.16');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        { clusterID: 'cluster-123', channel: 'eus-4.16' },
        expect.any(Object),
      );
    });
  });

  it('should display an error in the modal if mutation fails', async () => {
    mockUseGetChannelsData.mockReturnValue({
      availableDropdownChannels: mockOptions,
      isLoading: false,
    });

    mockUseEditChannelOnCluster.mockReturnValue({
      mutate: mutateMock,
      isError: true,
      error: { error: { errorMessage: 'Changing channel resulted in error' } },
    });

    const { user } = render(
      <ChannelEdit
        cluster={
          { ...mockedROSAHyperShiftCluster, channel: 'stable-4.16' } as ClusterWithPermissions
        }
      />,
    );

    await user.click(screen.getByTestId('channelModal'));

    expect(screen.getByTestId('error-box')).toBeInTheDocument();
    expect(screen.getByText('Changing channel resulted in error')).toBeInTheDocument();
  });
});
