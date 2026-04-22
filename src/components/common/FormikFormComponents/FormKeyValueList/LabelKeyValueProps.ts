import { FieldInputProps, FieldMetaProps } from 'formik';

type LabelKeyValueProps = {
  index: number;
  input: FieldInputProps<string | number | undefined>;
  meta: FieldMetaProps<string | number | undefined>;
  valueAriaLabel?: string;
};

export default LabelKeyValueProps;
