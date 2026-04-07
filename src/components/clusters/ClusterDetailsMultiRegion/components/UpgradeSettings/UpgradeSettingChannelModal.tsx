import * as React from 'react';
import { Formik } from 'formik';

import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

import { FieldId } from '~/components/clusters/wizards/common';
import { ChannelSelectField } from '~/components/clusters/wizards/common/ClusterSettings/Details/ChannelSelectField';
import ButtonWithTooltip from '~/components/common/ButtonWithTooltip';
import { Version } from '~/types/clusters_mgmt.v1';

export type UpgradeSettingChannelModalProps = {
  /** Disables the Change button (e.g. cluster not ready). */
  disableReason?: string;
  /** Cluster version object (includes available_channels for the channel list). */
  clusterVersion?: Version & { available_channels?: string[] };
  /** Current Y-stream channel from the cluster (`cluster.channel`). */
  channel?: string;
};

export const UpgradeSettingChannelModal = ({
  disableReason,
  clusterVersion,
  channel,
}: UpgradeSettingChannelModalProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/*
        Parent Stack uses column flex with default align-items: stretch, which makes
        buttons full-width. Match "Update" in the adjacent card (block flow = content width).
      */}
      <div className="pf-v6-u-align-self-flex-start">
        <ButtonWithTooltip
          variant="secondary"
          onClick={() => setIsOpen(true)}
          disableReason={disableReason}
        >
          Change
        </ButtonWithTooltip>
      </div>

      <Modal
        id="upgrade-settings-channel-modal"
        onClose={handleClose}
        isOpen={isOpen}
        variant={ModalVariant.small}
        aria-labelledby="upgrade-settings-channel-modal-title"
        aria-describedby="upgrade-settings-channel-modal-body"
      >
        <ModalHeader
          title="Change upgrade channel"
          labelId="upgrade-settings-channel-modal-title"
        />
        <ModalBody id="upgrade-settings-channel-modal-body">
          <Flex direction={{ default: 'column' }}>
            <p>
              Select a new channel for this cluster. The cluster will receive upgrades according to
              the channel you choose.
            </p>
            <Formik
              initialValues={{ [FieldId.VersionChannel]: channel ?? '' }}
              onSubmit={() => {}}
              enableReinitialize
            >
              <ChannelSelectField clusterVersion={clusterVersion} />
            </Formik>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button
            key="save-channel"
            variant="primary"
            onClick={() => {
              // TODO: persist channel change when API is wired
              handleClose();
            }}
          >
            Save
          </Button>
          <Button key="cancel-channel" variant="link" onClick={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
