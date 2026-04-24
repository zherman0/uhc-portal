import React, { useEffect } from 'react';
import { ArrayHelpers, Field, FormikValues } from 'formik';

import { Button, Grid, GridItem } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import { getRandomID } from '~/common/helpers';
import { validateLabelKey, validateLabelValue } from '~/common/validators';
import { FieldId } from '~/components/clusters/wizards/common/constants';
import { useFormState } from '~/components/clusters/wizards/hooks';

import ButtonWithTooltip from '../../ButtonWithTooltip';

import FormKeyLabelKey from './FormKeyLabelKey';
import FormKeyLabelValue from './FormKeyLabelValue';

import './FormKeyValueList.scss';

const DEFAULT_ADD_BUTTON_DISABLED_TOOLTIP = 'Enter a key before adding another row.';
const DEFAULT_KEY_INPUT_ARIA_LABEL = 'Key-value list key';

type KeyValueRow = { id?: string; key?: string; value?: string };

export interface FormKeyValueListProps extends ArrayHelpers {
  arrayFieldName?: string;
  keyColumnLabel?: string;
  valueColumnLabel?: string;
  addButtonLabel?: string;
  keyInputAriaLabel?: string;
  valueInputAriaLabel?: string;
  validateKey?: (
    key: string,
    allValues: Record<string, unknown>,
    props?: unknown,
    name?: string,
  ) => string | undefined;
  validateValue?: (
    value: string,
    allValues: Record<string, unknown>,
    props?: unknown,
    name?: string,
  ) => string | undefined;
  addButtonDisabledTooltip?: string;
}

const FormKeyValueList = ({
  push,
  remove,
  arrayFieldName = FieldId.NodeLabels,
  keyColumnLabel = 'Key',
  valueColumnLabel = 'Value',
  addButtonLabel = 'Add additional label',
  keyInputAriaLabel = DEFAULT_KEY_INPUT_ARIA_LABEL,
  valueInputAriaLabel,
  validateKey = validateLabelKey,
  validateValue = validateLabelValue,
  addButtonDisabledTooltip = DEFAULT_ADD_BUTTON_DISABLED_TOOLTIP,
}: FormKeyValueListProps) => {
  const { values, setFieldValue, setFieldTouched, getFieldProps, getFieldMeta, validateForm } =
    useFormState();

  const fieldRows = (values as FormikValues)[arrayFieldName] as KeyValueRow[];
  const rows = Array.isArray(fieldRows) ? fieldRows : [];

  const hasInvalidKeys = (fieldsArray: KeyValueRow[]) =>
    !fieldsArray || fieldsArray.some((field) => !field.key);

  useEffect(() => {
    if (!Array.isArray(fieldRows)) {
      validateForm();
      return;
    }
    if (fieldRows.length === 0) {
      setFieldValue(arrayFieldName, [{ id: getRandomID() }], false);
    } else if (fieldRows.some((row) => !row?.id)) {
      setFieldValue(
        arrayFieldName,
        fieldRows.map((row) => (row?.id ? row : { ...row, id: getRandomID() })),
        false,
      );
    }
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldRows, setFieldValue, arrayFieldName]);

  return (
    <Grid hasGutter>
      <GridItem span={4} className="pf-v6-c-form__label pf-v6-c-form__label-text">
        {keyColumnLabel}
      </GridItem>
      <GridItem span={4} className="pf-v6-c-form__label pf-v6-c-form__label-text">
        {valueColumnLabel}
      </GridItem>
      <GridItem span={4} />
      {rows.map((label, index) => {
        const isRemoveDisabled = index === 0 && rows.length === 1;
        const fieldNameLabelKey = `${arrayFieldName}[${index}].key`;
        const fieldNameLabelValue = `${arrayFieldName}[${index}].value`;
        const rowKey = label.id ?? `${arrayFieldName}-row-${index}`;

        return (
          /* Prefer stable row id; index fallback only until useEffect backfills ids (avoids duplicate "undefined" keys). */
          <React.Fragment key={rowKey}>
            <GridItem span={4}>
              <Field
                name={fieldNameLabelKey}
                type="text"
                component={FormKeyLabelKey}
                index={index}
                keyInputAriaLabel={keyInputAriaLabel}
                validate={(value: string) => {
                  const newRows = [...rows];
                  newRows[index] = { ...newRows[index], key: value };
                  return validateKey(
                    value,
                    { ...values, [arrayFieldName]: newRows } as FormikValues,
                    undefined,
                    fieldNameLabelKey,
                  );
                }}
                input={{
                  ...getFieldProps(fieldNameLabelKey),
                  onChange: (value: string) => {
                    setFieldValue(fieldNameLabelKey, value, false);
                    setFieldTouched(fieldNameLabelKey, true, false);
                  },
                }}
                meta={getFieldMeta(fieldNameLabelKey)}
              />
            </GridItem>
            <GridItem span={4}>
              <Field
                name={fieldNameLabelValue}
                type="text"
                component={FormKeyLabelValue}
                index={index}
                valueAriaLabel={valueInputAriaLabel}
                validate={(value: string) => {
                  const newRows = [...rows];
                  newRows[index] = { ...newRows[index], value };
                  return validateValue(
                    value,
                    { ...values, [arrayFieldName]: newRows } as FormikValues,
                    undefined,
                    fieldNameLabelValue,
                  );
                }}
                input={{
                  ...getFieldProps(fieldNameLabelValue),
                  onChange: (value: string) => {
                    setFieldValue(fieldNameLabelValue, value, false);
                    setFieldTouched(fieldNameLabelValue, true, false);
                  },
                }}
                meta={getFieldMeta(fieldNameLabelValue)}
              />
            </GridItem>
            <GridItem span={4}>
              <Button
                onClick={() => remove(index)}
                icon={<MinusCircleIcon />}
                variant="link"
                isDisabled={isRemoveDisabled}
                aria-label="Remove item"
                className={
                  isRemoveDisabled
                    ? 'formKeyValueList-removeBtn-disabled'
                    : 'formKeyValueList-removeBtn'
                }
              />
            </GridItem>
          </React.Fragment>
        );
      })}
      <GridItem>
        <ButtonWithTooltip
          onClick={() => push({ id: getRandomID() })}
          icon={<PlusCircleIcon />}
          variant="link"
          isInline
          className="formKeyValueList-addBtn"
          disableReason={hasInvalidKeys(rows) && addButtonDisabledTooltip}
        >
          {addButtonLabel}
        </ButtonWithTooltip>
      </GridItem>
    </Grid>
  );
};

export default FormKeyValueList;
