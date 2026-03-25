import { flattenUnmetAcknowledgementErrorDetails } from './flattenUnmetAcknowledgementErrorDetails';

describe('flattenUnmetAcknowledgementErrorDetails', () => {
  it('splits one object with several validation_error_N into one element per key', () => {
    expect(
      flattenUnmetAcknowledgementErrorDetails([
        {
          validation_error_1: { reason: 'A', details: [] },
          validation_error_2: { reason: 'B', details: [] },
          validation_error_3: { reason: 'C', details: [] },
        },
      ]),
    ).toEqual([
      { validation_error_1: { reason: 'A', details: [] } },
      { validation_error_2: { reason: 'B', details: [] } },
      { validation_error_3: { reason: 'C', details: [] } },
    ]);
  });

  it('leaves a single validation_error wrapper unchanged', () => {
    const one = [{ validation_error_1: { reason: 'x', details: [] } }];
    expect(flattenUnmetAcknowledgementErrorDetails(one)).toEqual(one);
  });

  it('merges top-level reason onto legacy Error_Key-only detail rows', () => {
    const row = [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }];
    expect(
      flattenUnmetAcknowledgementErrorDetails(
        row,
        "Role is not compatible with version 'openshift-v4.20.16'",
      ),
    ).toEqual([
      {
        Error_Key: 'VersionNotSupportedByAccountRoleTag',
        kind: 'Error',
        reason: "Role is not compatible with version 'openshift-v4.20.16'",
      },
    ]);
  });

  it('leaves Error_Key row unchanged when it already has reason', () => {
    const row = [
      {
        Error_Key: 'SomeKey',
        reason: 'Already on the detail',
      },
    ];
    expect(flattenUnmetAcknowledgementErrorDetails(row, 'Top level reason')).toEqual(row);
  });

  it('uses empty string for Error_Key rows when no top-level reason is passed', () => {
    const row = [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }];
    expect(flattenUnmetAcknowledgementErrorDetails(row)).toEqual([
      {
        Error_Key: 'VersionNotSupportedByAccountRoleTag',
        kind: 'Error',
        reason: '',
      },
    ]);
  });

  it('sorts validation_error_10 after validation_error_2', () => {
    expect(
      flattenUnmetAcknowledgementErrorDetails([
        {
          validation_error_10: { reason: 'ten' },
          validation_error_2: { reason: 'two' },
        },
      ]),
    ).toEqual([
      { validation_error_2: { reason: 'two' } },
      { validation_error_10: { reason: 'ten' } },
    ]);
  });
});
