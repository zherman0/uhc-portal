import React from 'react';

import { Grid, GridItem } from '@patternfly/react-core';

import ErrorBox from '~/components/common/ErrorBox';
import { ErrorState } from '~/types/types';

import { getErrorDetailReasonMessage, getErrorDetailRowKey } from './upgradeWizardHelper';

interface UnmetAcknowledgementsErrorDetailsProps {
  error: Pick<
    ErrorState,
    'operationID' | 'message' | 'errorDetails' | 'errorMessage' | 'errorCode' | 'reason'
  >;
}

const UnmetAcknowledgementsErrorDetails = ({ error }: UnmetAcknowledgementsErrorDetailsProps) => (
  <Grid hasGutter>
    <GridItem span={1} />
    <GridItem span={10}>
      {error?.errorDetails?.map((errorDetail: unknown, index: number) => (
        <GridItem key={getErrorDetailRowKey(errorDetail, index)}>
          <ErrorBox
            response={{
              errorMessage: getErrorDetailReasonMessage(errorDetail),
              operationID: error?.operationID,
            }}
            message="A problem occurred with that selected version"
          />
        </GridItem>
      ))}
    </GridItem>
    <GridItem span={1} />
  </Grid>
);

export default UnmetAcknowledgementsErrorDetails;
