import React from 'react';

import { checkAccessibility, render, screen, within } from '~/testUtils';
import { ErrorState } from '~/types/types';

import UnmetAcknowledgementsErrorAlert from './UnmetAcknowledgementsErrorAlert';

const baseError: Pick<
  ErrorState,
  'operationID' | 'message' | 'errorDetails' | 'errorMessage' | 'errorCode' | 'reason'
> = {
  errorMessage: 'CLUSTERS-MGMT-400: Upgrade failed',
  errorDetails: [],
  operationID: 'op-123',
};

describe('<UnmetAcknowledgementsErrorAlert />', () => {
  it('renders the alert title', () => {
    render(
      <UnmetAcknowledgementsErrorAlert
        error={{
          ...baseError,
          // API payloads are wider than `ErrorDetail`
          errorDetails: [{ reason: 'First validation message' }] as any,
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /A problem occurred with that selected version/i }),
    ).toBeInTheDocument();
  });

  it('renders a list item per error detail (flattened validation_error_N entries)', () => {
    render(
      <UnmetAcknowledgementsErrorAlert
        error={{
          ...baseError,
          errorDetails: [
            {
              validation_error_1: {
                reason: 'Role is not compatible with the target version',
              },
            },
            {
              validation_error_2: {
                reason: 'Second validation issue',
              },
            },
          ] as any,
        }}
      />,
    );

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Role is not compatible with the target version');
    expect(items[1]).toHaveTextContent('Second validation issue');
  });

  it('renders reason from nested validation_error_* detail objects', () => {
    render(
      <UnmetAcknowledgementsErrorAlert
        error={{
          ...baseError,
          errorDetails: [
            {
              validation_error_1: {
                reason: 'Nested dry-run validation message',
                details: [],
              },
            },
          ] as any,
        }}
      />,
    );

    expect(screen.getByText('Nested dry-run validation message')).toBeInTheDocument();
  });

  it('passes operation ID through to the error details section', async () => {
    const { user } = render(
      <UnmetAcknowledgementsErrorAlert
        error={{
          ...baseError,
          operationID: 'd2d2aaa7-7a86-4f31-a2d5-47c61c7d020b',
          errorDetails: [{ reason: 'Some issue' }] as any,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /More details/i }));

    expect(
      screen.getByText('Operation ID: d2d2aaa7-7a86-4f31-a2d5-47c61c7d020b'),
    ).toBeInTheDocument();
  });

  it('renders an empty list when errorDetails is empty', () => {
    render(<UnmetAcknowledgementsErrorAlert error={{ ...baseError, errorDetails: [] }} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('is accessible', async () => {
    const { container } = render(
      <UnmetAcknowledgementsErrorAlert
        error={{
          ...baseError,
          errorDetails: [{ reason: 'Accessibility test message' }] as any,
        }}
      />,
    );

    await checkAccessibility(container);
  });
});
