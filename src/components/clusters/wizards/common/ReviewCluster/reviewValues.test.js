import reviewValues from './reviewValues';

describe('reviewValues', () => {
  describe('defaultRouterExcludeNamespaceSelectors', () => {
    const { title, valueTransform } = reviewValues.defaultRouterExcludeNamespaceSelectors;

    it('uses the expected review title', () => {
      expect(title).toBe('Exclude namespace selectors');
    });

    it('shows None specified when rows are missing or empty', () => {
      expect(valueTransform(undefined)).toBe('None specified');
      expect(valueTransform(null)).toBe('None specified');
      expect(valueTransform([])).toBe('None specified');
    });

    it('shows None specified when only placeholder or whitespace keys are present', () => {
      expect(
        valueTransform([
          { id: '1', key: '', value: '' },
          { key: '   ', value: 'x' },
        ]),
      ).toBe('None specified');
    });

    it('shows None specified when a key has no non-empty values after parsing', () => {
      expect(valueTransform([{ key: 'env', value: '' }])).toBe('None specified');
      expect(valueTransform([{ key: 'env', value: '  ,  ' }])).toBe('None specified');
    });

    it('formats a single selector row', () => {
      expect(valueTransform([{ key: 'type', value: 'customer' }])).toBe('type: customer');
    });

    it('formats comma-separated values and trims keys', () => {
      expect(valueTransform([{ key: '  department  ', value: 'finance, HR, legal' }])).toBe(
        'department: finance, HR, legal',
      );
    });

    it('joins multiple selector rows with semicolons', () => {
      expect(
        valueTransform([
          { key: 'department', value: 'finance' },
          { key: 'type', value: 'customer' },
        ]),
      ).toBe('department: finance; type: customer');
    });
  });
});
