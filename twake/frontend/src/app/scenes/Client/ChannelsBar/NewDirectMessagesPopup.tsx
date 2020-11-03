import React, { FC, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelsService from 'services/channels/channels.js';
import MediumPopupComponent from 'app/services/Modal/ModalManager';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import UserListManager from 'components/UserListManager/UserListManager.js';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);

  return (
    <ObjectModal
      title={
        <ObjectModalTitle>
          {Languages.t('scenes.app.channelsbar.channelsuser.new_private_discussion')}
        </ObjectModalTitle>
      }
      onClose={() => MediumPopupComponent.closeAll()}
      noScrollBar={true}
      footer={
        <Button
          className="small primary"
          style={{ width: 'auto', float: 'right' }}
          disabled={newUserDiscussion.length === 0}
          onClick={() => {
            ChannelsService.openDiscussion(newUserDiscussion);
            MediumPopupComponent.closeAll();
          }}
        >
          {Languages.t('general.continue', [], 'Continue')}
        </Button>
      }
    >
      <UserListManager
        users={[]}
        canRemoveMyself
        noPlaceholder
        scope="group"
        autoFocus
        onUpdate={(ids: string[]) => setNewUserDiscussion(ids)}
      />
    </ObjectModal>
  );
};

export default NewDirectMessagesPopup;
