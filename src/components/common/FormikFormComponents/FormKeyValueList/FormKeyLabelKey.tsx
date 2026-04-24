import React from 'react';

import { TextInput } from '@patternfly/react-core';

import { FormGroupHelperText } from '../../FormGroupHelperText';

import LabelKeyValueProps from './LabelKeyValueProps';

const FormKeyLabelKey = ({ input, meta: { touched, error } }: LabelKeyValueProps) => (
  <>
    <TextInput
      aria-label="Key-value list key"
      validated={touched && error ? 'error' : 'default'}
      onChange={(_, value) => input.onChange(value)}
      value={input.value}
    />
    <FormGroupHelperText touched={touched} error={touched ? error : undefined} />
  </>
);

export default FormKeyLabelKey;
