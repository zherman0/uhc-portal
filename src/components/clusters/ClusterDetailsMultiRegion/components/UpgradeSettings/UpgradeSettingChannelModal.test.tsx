import * as React from 'react';

import { render, screen, waitFor } from '~/testUtils';

import { UpgradeSettingChannelModal } from './UpgradeSettingChannelModal';

jest.mock('./ChannelSelectField', () => ({
  __esModule: true,
  default: () => <div data-testid="channel-select-stub" />,
}));

describe('<UpgradeSettingChannelModal />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Change button', () => {
    render(<UpgradeSettingChannelModal />);

    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('opens modal when Change is clicked and shows title and channel field stub', async () => {
    const { user } = render(<UpgradeSettingChannelModal />);

    await user.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Change upgrade channel' })).toBeInTheDocument();
    });
    expect(screen.getByText(/Select a new channel for this cluster/)).toBeInTheDocument();
    expect(screen.getByTestId('channel-select-stub')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', async () => {
    const { user } = render(<UpgradeSettingChannelModal />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Change upgrade channel' })).toBeVisible();
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Change upgrade channel' }),
      ).not.toBeInTheDocument();
    });
  });

  it('closes modal when Save is clicked', async () => {
    const { user } = render(<UpgradeSettingChannelModal />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Change upgrade channel' })).toBeVisible();
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Change upgrade channel' }),
      ).not.toBeInTheDocument();
    });
  });

  it('disables Change button when disableReason is set', () => {
    render(<UpgradeSettingChannelModal disableReason="Cluster is not ready" />);

    expect(screen.getByRole('button', { name: 'Change' })).toHaveAttribute('aria-disabled', 'true');
  });
});
