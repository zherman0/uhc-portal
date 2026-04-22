import React from 'react';
import { Formik, FormikValues } from 'formik';

import { ExcludeNamespaceSelectorsHelpText } from '~/components/clusters/ClusterDetailsMultiRegion/components/Networking/components/ApplicationIngressCard/ExcludeNamespaceSelectorsPopover';
import { CloudProviderType } from '~/components/clusters/wizards/common/constants';
import { EXCLUDE_NAMESPACE_SELECTORS } from '~/queries/featureGates/featureConstants';
import { mockUseFeatureGate, render, screen, waitFor } from '~/testUtils';

import { FieldId, initialValues } from '../constants';

import { DefaultIngressFields } from './DefaultIngressFields';

const renderWithFormik = (values?: Partial<FormikValues>) =>
  render(
    <Formik initialValues={{ ...initialValues, ...values }} onSubmit={() => {}}>
      <DefaultIngressFields />
    </Formik>,
  );

describe('DefaultIngressFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureGate([]);
  });

  describe('Exclude namespace selectors (GCP + feature gate)', () => {
    it('renders the field group, helper copy, key/value UI, and warning when the gate is on and provider is GCP', async () => {
      const useFeatureGateSpy = mockUseFeatureGate([[EXCLUDE_NAMESPACE_SELECTORS, true]]);
      renderWithFormik({ [FieldId.CloudProvider]: CloudProviderType.Gcp });

      expect(useFeatureGateSpy).toHaveBeenCalledWith(EXCLUDE_NAMESPACE_SELECTORS);

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: 'Exclude namespace selector values' }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText('Exclude namespace selectors', {
          selector: 'label .pf-v6-c-form__label-text',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(ExcludeNamespaceSelectorsHelpText)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add selector' })).toBeInTheDocument();
      expect(screen.getByText('Values (comma-separated)')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Do not exclude openshift-console or openshift-authentication namespaces as they are vital to cluster operations.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render the exclude-namespace selectors block when the feature gate is off', () => {
      renderWithFormik({ [FieldId.CloudProvider]: CloudProviderType.Gcp });

      expect(
        screen.queryByRole('textbox', { name: 'Exclude namespace selector values' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ExcludeNamespaceSelectorsHelpText)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add selector' })).not.toBeInTheDocument();
    });

    it('does not render the block when the gate is on but the cloud provider is not GCP', () => {
      mockUseFeatureGate([[EXCLUDE_NAMESPACE_SELECTORS, true]]);
      renderWithFormik({ [FieldId.CloudProvider]: CloudProviderType.Aws });

      expect(
        screen.queryByRole('textbox', { name: 'Exclude namespace selector values' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(ExcludeNamespaceSelectorsHelpText)).not.toBeInTheDocument();
    });
  });
});
