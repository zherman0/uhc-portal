import * as React from 'react';

import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

import ButtonWithTooltip from '~/components/common/ButtonWithTooltip';

import ChannelSelectField from './ChannelSelectField';

export type UpgradeSettingChannelModalProps = {
  /** Disables the Change button (e.g. cluster not ready). */
  disableReason?: string;
};

export const UpgradeSettingChannelModal = ({ disableReason }: UpgradeSettingChannelModalProps) => {
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
            <ChannelSelectField />
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
