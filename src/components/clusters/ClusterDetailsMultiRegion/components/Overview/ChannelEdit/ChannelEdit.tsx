import React from 'react';
import { Field, Formik } from 'formik';

import {
  Button,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  StackItem,
  Title,
} from '@patternfly/react-core';

import docLinks from '~/common/docLinks.mjs';
import clusterStates from '~/components/clusters/common/clusterStates';
import { constants } from '~/components/clusters/common/CreateOSDFormConstants';
import EditButton from '~/components/common/EditButton';
import ErrorBox from '~/components/common/ErrorBox';
import ExternalLink from '~/components/common/ExternalLink';
import PopoverHint from '~/components/common/PopoverHint';
import { useEditChannelOnCluster } from '~/queries/ChannelEditQueries/useEditChannelOnCluster';
import { invalidateClusterDetailsQueries } from '~/queries/ClusterDetailsQueries/useFetchClusterDetails';
import { Cluster } from '~/types/clusters_mgmt.v1';

import { formatChannelName } from '../../../clusterDetailsHelper';

import { ChannelSelect } from './ChannelSelect';
import { useGetChannelsData } from './useGetChannelsData';

type ChannelEditModalProps = {
  clusterID: string;
  isOpen: boolean;
  onClose: () => void;
  channel: string;
  optionsDropdownData: {
    value: string;
    label: string;
  }[];
};

type ChannelEditProps = {
  clusterID: string;
  channel: string;
  cluster: CanEditCluster;
};

export interface CanEditCluster extends Cluster {
  canEdit: boolean;
}

const ChannelEditModal = ({
  clusterID,
  isOpen,
  onClose,
  channel,
  optionsDropdownData,
}: ChannelEditModalProps) => {
  const { mutate, isError, error, isPending } = useEditChannelOnCluster();

  const handleClose = () => {
    onClose();
  };
  return isOpen ? (
    <Formik
      initialValues={{ channel }}
      onSubmit={(values: { channel: string }) => {
        const { channel: newChannel } = values;
        mutate(
          { clusterID, channel: newChannel },
          {
            onSuccess: () => {
              handleClose();
              invalidateClusterDetailsQueries();
            },
          },
        );
      }}
    >
      {(formik) => (
        <Modal
          id="edit-channel-modal"
          title="Edit channel"
          variant={ModalVariant.small}
          onClose={handleClose}
          isOpen={isOpen}
          aria-labelledby="edit-channel-modal"
          aria-describedby="modal-box-edit-channel"
        >
          <ModalHeader>
            <Title headingLevel="h1">Edit channel</Title>
          </ModalHeader>
          <ModalBody>
            {isError && (
              <StackItem>
                <ErrorBox
                  message={error?.error?.errorMessage ? error.error.errorMessage : ''}
                  response={{
                    operationID: error?.error?.operationID,
                  }}
                />
                <br />
              </StackItem>
            )}
            <Field
              fieldId="channel"
              label="Channel"
              name="channel"
              component={ChannelSelect}
              optionsDropdownData={optionsDropdownData}
              input={{
                ...formik.getFieldProps('channel'),
                onChange: (value: string) => formik.setFieldValue('channel', value),
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              key="confirm"
              variant="primary"
              onClick={formik.submitForm}
              isDisabled={isPending || !formik.dirty}
            >
              Save
            </Button>
            <Button key="cancel" variant="link" onClick={handleClose}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  ) : null;
};

export const ChannelEdit = ({ clusterID, channel, cluster }: ChannelEditProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const { canEdit } = cluster;
  const isClusterReady = cluster.state === clusterStates.ready;
  const { availableDropdownChannels, isLoading } = useGetChannelsData(cluster, canEdit);
  const hasChannelOptions = (availableDropdownChannels?.length ?? 0) > 0;

  return (
    <>
      {isModalOpen && (
        <ChannelEditModal
          clusterID={clusterID}
          isOpen={isModalOpen}
          optionsDropdownData={availableDropdownChannels}
          onClose={() => setIsModalOpen(false)}
          channel={channel ?? ''}
        />
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>
          Channel
          <PopoverHint
            iconClassName="pf-v6-u-ml-sm"
            hint={
              <>
                {constants.channelHint}{' '}
                <ExternalLink href={docLinks.OCP_UPDATE_CHANNELS}>Learn more</ExternalLink>
              </>
            }
          />
        </DescriptionListTerm>
        <DescriptionListDescription>
          {formatChannelName(channel ?? '')}
          {canEdit && isLoading ? <Spinner size="sm" aria-label="Loading..." /> : null}
          {canEdit && !isLoading && hasChannelOptions ? (
            <EditButton
              data-testid="channelModal"
              ariaLabel="editChannelBtn"
              onClick={() => setIsModalOpen(true)}
              isAriaDisabled={!canEdit || !isClusterReady}
            />
          ) : null}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};
