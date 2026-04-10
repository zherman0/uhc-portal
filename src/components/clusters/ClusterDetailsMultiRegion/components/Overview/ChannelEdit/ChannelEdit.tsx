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
  Stack,
  StackItem,
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
import { AugmentedCluster } from '~/types/types';

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
          <ModalHeader
            title="Edit channel"
            description="Select a new channel for this cluster. The cluster will receive upgrades according to the channel you choose."
            labelId="edit-channel-modal"
          />
          <ModalBody>
            <Stack hasGutter>
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
              <StackItem>
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
              </StackItem>
            </Stack>
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

export const ChannelEdit = ({ cluster }: { cluster: AugmentedCluster }) => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const { canUpdateClusterResource } = cluster;
  const isClusterReady = cluster.state === clusterStates.ready;
  const { availableDropdownChannels, isLoading } = useGetChannelsData(cluster);
  const hasChannelOptions = (availableDropdownChannels?.length ?? 0) > 0;

  return (
    <>
      {isModalOpen && (
        <ChannelEditModal
          clusterID={cluster.id ?? ''}
          isOpen={isModalOpen}
          optionsDropdownData={availableDropdownChannels}
          onClose={() => setIsModalOpen(false)}
          channel={cluster.channel ?? ''}
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
          {formatChannelName(cluster?.channel ?? '')}
          {canUpdateClusterResource && isLoading ? (
            <Spinner size="sm" aria-label="Loading..." />
          ) : null}
          {canUpdateClusterResource && !isLoading && hasChannelOptions ? (
            <EditButton
              data-testid="channelModal"
              ariaLabel="editChannelBtn"
              onClick={() => setIsModalOpen(true)}
              isAriaDisabled={!canUpdateClusterResource || !isClusterReady}
            />
          ) : null}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};
