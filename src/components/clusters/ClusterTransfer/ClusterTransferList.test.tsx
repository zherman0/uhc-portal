import React from 'react';

import { CLUSTER_TRANSFER_VIEW } from '~/redux/constants/viewConstants';
import { render, screen, userEvent, within, withState } from '~/testUtils';
import { ClusterTransferStatus } from '~/types/accounts_mgmt.v1';

import fixtures from '../ClusterDetailsMultiRegion/__tests__/ClusterDetails.fixtures';

import ClusterTransferList from './ClusterTransferList';

jest.mock(
  '~/queries/ClusterDetailsQueries/ClusterTransferOwnership/useFetchClusterTransferDetails',
  () => ({
    useFetchClusterTransferDetail: jest.fn(),
  }),
);
const emptyStateText = 'No cluster transfers found.';
const testOwner = 'testOwner';
const testRecipient = 'testRecipient';
const useFetchClusterTransferDetailMock = jest.requireMock(
  '~/queries/ClusterDetailsQueries/ClusterTransferOwnership/useFetchClusterTransferDetails',
);

const CLUSTER_TRANSFER_NAME_SORT_FIELD = 'name';

const makeTransferItem = (name: string, transferId: string) => ({
  ...fixtures.clusterDetails.cluster,
  id: transferId,
  status: ClusterTransferStatus.Pending.toLowerCase(),
  owner: testOwner,
  name,
  version: { raw_id: '4.17' },
  recipient: testRecipient,
});

describe('<ClusterTransferList />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('Data is loading', async () => {
    useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      errors: [],
      isError: false,
    });
    render(<ClusterTransferList />);
    expect(
      screen.getByRole('progressbar', { name: 'Loading cluster transfer list data' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when done loading and no clusters returned', () => {
    useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      errors: [],
      isError: false,
    });

    render(<ClusterTransferList />);

    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByText(emptyStateText)).toBeInTheDocument();
  });

  it('shows data when cluster available', () => {
    useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue({
      data: {
        items: [
          {
            ...fixtures.clusterDetails.cluster,
            status: ClusterTransferStatus.Pending.toLowerCase(),
            owner: testOwner,
            name: fixtures.clusterDetails.cluster.subscription.display_name,
            version: {
              raw_id: '4.17',
            },
            recipient: testRecipient,
          },
        ],
      },
      isLoading: false,
      errors: [],
      isError: false,
    });
    const state = {
      userProfile: { keycloakProfile: { testOwner } },
    };
    withState(state).render(<ClusterTransferList />);
    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeInTheDocument();

    expect(
      screen.getByText(fixtures.clusterDetails.cluster.subscription.display_name),
    ).toBeInTheDocument();
  });

  it('Accept/Decline action button shown', async () => {
    const state = {
      userProfile: { keycloakProfile: { testRecipient } },
    };
    useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue({
      data: {
        items: [
          {
            ...fixtures.clusterDetails.cluster,
            status: ClusterTransferStatus.Pending.toLowerCase(),
            owner: testOwner,
            name: fixtures.clusterDetails.cluster.subscription.display_name,
            version: {
              raw_id: '4.17',
            },
            recipient: testRecipient,
          },
        ],
      },
      isLoading: false,
      errors: [],
      isError: false,
    });

    withState(state).render(<ClusterTransferList />);

    expect(screen.getByRole('button', { name: 'Accept/Decline' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Accept/Decline'));
    expect(screen.getByRole('heading', { name: 'Complete cluster transfer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept Transfer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline Transfer' })).toBeInTheDocument();
  });

  describe('name column sorting', () => {
    const twoItemsUnsortedApiOrder = {
      data: {
        items: [
          makeTransferItem('Zebra cluster', 'transfer-z'),
          makeTransferItem('Alpha cluster', 'transfer-a'),
        ],
      },
      isLoading: false,
      errors: [],
      isError: false,
    };

    const baseUserState = {
      userProfile: { keycloakProfile: { username: testOwner } },
    };

    const getNameCellsInOrder = () => {
      const dataRows = screen.getAllByRole('row').slice(1);
      return dataRows.map((row) => within(row).getAllByRole('cell')[0]);
    };

    it('sorts by merged display name ascending when redux sortField is name and isAscending', () => {
      useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue(
        twoItemsUnsortedApiOrder,
      );

      const testState = withState(
        {
          ...baseUserState,
          viewOptions: {
            [CLUSTER_TRANSFER_VIEW]: {
              sorting: {
                sortField: CLUSTER_TRANSFER_NAME_SORT_FIELD,
                isAscending: true,
                sortIndex: 0,
              },
            },
          },
        },
        true,
      );
      testState.render(<ClusterTransferList />);

      const nameCells = getNameCellsInOrder();
      expect(nameCells[0]).toHaveTextContent('Alpha cluster');
      expect(nameCells[1]).toHaveTextContent('Zebra cluster');
      expect(testState.getState().viewOptions[CLUSTER_TRANSFER_VIEW].sorting.sortField).toBe(
        CLUSTER_TRANSFER_NAME_SORT_FIELD,
      );
    });

    it('sorts by merged display name descending when isAscending is false', () => {
      useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue(
        twoItemsUnsortedApiOrder,
      );

      withState(
        {
          ...baseUserState,
          viewOptions: {
            [CLUSTER_TRANSFER_VIEW]: {
              sorting: {
                sortField: CLUSTER_TRANSFER_NAME_SORT_FIELD,
                isAscending: false,
                sortIndex: 0,
              },
            },
          },
        },
        true,
      ).render(<ClusterTransferList />);

      const nameCells = getNameCellsInOrder();
      expect(nameCells[0]).toHaveTextContent('Zebra cluster');
      expect(nameCells[1]).toHaveTextContent('Alpha cluster');
    });

    it('leaves API order when not sorting by name', () => {
      useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue(
        twoItemsUnsortedApiOrder,
      );

      withState(
        {
          ...baseUserState,
          viewOptions: {
            [CLUSTER_TRANSFER_VIEW]: {
              sorting: {
                sortField: 'created_at',
                isAscending: false,
                sortIndex: 0,
              },
            },
          },
        },
        true,
      ).render(<ClusterTransferList />);

      const nameCells = getNameCellsInOrder();
      expect(nameCells[0]).toHaveTextContent('Zebra cluster');
      expect(nameCells[1]).toHaveTextContent('Alpha cluster');
    });

    it('updates redux sort to name when the Name column sort control is activated', async () => {
      useFetchClusterTransferDetailMock.useFetchClusterTransferDetail.mockReturnValue(
        twoItemsUnsortedApiOrder,
      );

      const testState = withState(
        {
          ...baseUserState,
          viewOptions: {
            [CLUSTER_TRANSFER_VIEW]: {
              sorting: {
                sortField: 'created_at',
                isAscending: false,
                sortIndex: 0,
              },
            },
          },
        },
        true,
      );
      const { user } = testState.render(<ClusterTransferList />);

      expect(testState.getState().viewOptions[CLUSTER_TRANSFER_VIEW].sorting.sortField).toBe(
        'created_at',
      );

      const nameHeader = screen.getByRole('columnheader', { name: /^Name$/i });
      const sortButton = within(nameHeader).getByRole('button');
      await user.click(sortButton);

      expect(testState.getState().viewOptions[CLUSTER_TRANSFER_VIEW].sorting.sortField).toBe(
        CLUSTER_TRANSFER_NAME_SORT_FIELD,
      );
      expect(testState.getState().viewOptions[CLUSTER_TRANSFER_VIEW].sorting.isAscending).toBe(
        true,
      );
    });
  });
});
