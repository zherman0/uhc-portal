import React from 'react';

import { Grid, GridItem, List, ListItem, Stack, StackItem } from '@patternfly/react-core';

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
        <StackItem>
          <ErrorBox
            response={{
              errorDetails: error?.errorDetails,
              errorMessage: error?.errorMessage,
              operationID: error?.operationID,
            }}
            message="A problem occurred with that selected version"
          >
            <List>
              {error?.errorDetails?.map((errorDetail: unknown, index: number) => (
                <ListItem key={getErrorDetailRowKey(errorDetail, index)}>
                  {getErrorDetailReasonMessage(errorDetail)}
                </ListItem>
              ))}
            </List>
          </ErrorBox>
        </StackItem>
      </Stack>
    </GridItem>
  </Grid>
);

export default UnmetAcknowledgementsErrorAlert;
