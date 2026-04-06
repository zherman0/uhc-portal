import { resolveUnmetAcknowledgementErrorDetailsForUi } from './unmetAcknowledgementErrorDetails';

describe('resolveUnmetAcknowledgementErrorDetailsForUi', () => {
  describe('non-aggregated (Error_Key + top-level reason)', () => {
    it('merges top-level reason onto Error_Key-only rows (upgrade_policies_xhr shape)', () => {
      const details = [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }];
      const topReason =
        "Role 'arn:aws:iam::720424066366:role/zac419b-Installer-Role' is not compatible with version 'openshift-v4.20.16'";
      expect(resolveUnmetAcknowledgementErrorDetailsForUi(false, details, topReason)).toEqual([
        {
          Error_Key: 'VersionNotSupportedByAccountRoleTag',
          kind: 'Error',
          reason: topReason,
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
      expect(resolveUnmetAcknowledgementErrorDetailsForUi(false, row, 'Top level reason')).toEqual(
        row,
      );
    });

    it('uses empty string for Error_Key rows when no top-level reason is passed', () => {
      const row = [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }];
      expect(resolveUnmetAcknowledgementErrorDetailsForUi(false, row, '')).toEqual([
        {
          Error_Key: 'VersionNotSupportedByAccountRoleTag',
          kind: 'Error',
          reason: '',
        },
      ]);
    });
  });

  describe('aggregated (validation_error_N with nested reason)', () => {
    it('passes single validation_error_* row through unchanged (upgrade3.json shape)', () => {
      const aggregated = [
        {
          validation_error_1: {
            reason:
              "Role 'arn:aws:iam::720424066366:role/zac419b-Installer-Role' is not compatible with version 'openshift-v4.20.16'",
            details: [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }],
            timestamp: '0001-01-01T00:00:00Z',
          },
        },
      ];
      expect(resolveUnmetAcknowledgementErrorDetailsForUi(true, aggregated, 'ignored')).toEqual(
        aggregated,
      );
    });

    it('splits one details row with multiple validation entries into one row per Object.values entry', () => {
      const bundled = [
        {
          validation_error_1: {
            reason: 'First issue',
            details: [{ Error_Key: 'VersionNotSupportedByAccountRoleTag' }],
            timestamp: '0001-01-01T00:00:00Z',
          },
          validation_error_2: {
            reason: 'Second issue',
            details: [{ Error_Key: 'SecondMockErrorKey' }],
            timestamp: '0001-01-01T00:00:00Z',
          },
          validation_error_3: {
            reason: 'Third issue',
            details: [{ Error_Key: 'ThirdMockErrorKey' }],
            timestamp: '0001-01-01T00:00:00Z',
          },
        },
      ];
      expect(resolveUnmetAcknowledgementErrorDetailsForUi(true, bundled, 'ignored')).toEqual([
        bundled[0].validation_error_1,
        bundled[0].validation_error_2,
        bundled[0].validation_error_3,
      ]);
    });
  });

  it('returns empty array when details is missing or empty', () => {
    expect(resolveUnmetAcknowledgementErrorDetailsForUi(false, undefined, 'r')).toEqual([]);
    expect(resolveUnmetAcknowledgementErrorDetailsForUi(true, [], 'r')).toEqual([]);
  });
});
