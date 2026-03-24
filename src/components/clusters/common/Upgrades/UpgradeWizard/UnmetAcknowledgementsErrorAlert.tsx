import React from 'react';

import { Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import ErrorBox from '~/components/common/ErrorBox';
import { ErrorState } from '~/types/types';

import { getErrorDetailReasonMessage, getErrorDetailRowKey } from './upgradeWizardHelper';

interface UnmetAcknowledgementsErrorAlertProps {
  error: Pick<
    ErrorState,
    'operationID' | 'message' | 'errorDetails' | 'errorMessage' | 'errorCode' | 'reason'
  >;
}

const UnmetAcknowledgementsErrorAlert = ({ error }: UnmetAcknowledgementsErrorAlertProps) => (
  <Grid hasGutter>
    <GridItem span={1} />
    <GridItem span={10}>
      <Stack hasGutter>
        <StackItem />
        {error?.errorDetails?.map((errorDetail: unknown, index: number) => (
          <StackItem key={getErrorDetailRowKey(errorDetail, index)}>
            <ErrorBox
              response={{
                errorMessage: getErrorDetailReasonMessage(errorDetail),
                operationID: error?.operationID,
              }}
              message="A problem occurred with that selected version"
            />
          </StackItem>
        ))}
      </Stack>
    </GridItem>
  </Grid>
);

export default UnmetAcknowledgementsErrorAlert;
