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

  it('passes through non-validation details (e.g. Error_Key)', () => {
    const row = [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }];
    expect(flattenUnmetAcknowledgementErrorDetails(row)).toEqual(row);
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
