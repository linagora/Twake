import React, { FC, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelsService from 'services/channels/channels.js';
import MediumPopupComponent from 'app/services/Modal/ModalManager';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import Collections from 'app/services/CollectionsReact/Collections';

import { useParams } from 'react-router-dom';
import RouterServices from 'services/RouterServices';
import OldCollections from 'services/Depreciated/Collections/Collections';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);

  const { workspaceId, companyId } = RouterServices.useStateFromRoute();
  const company_id = companyId;

  const collectionPath: string = `companies/${company_id}/workspaces/direct/channels/`;
  const ChannelsCollections = Collections.get(collectionPath);

  const upsertDirectMessage = async (): Promise<any> => {
    const newDirectMessage: ChannelType = {
      company_id: company_id,
      workspace_id: workspaceId,
      visibility: 'direct',
    };

    await ChannelsCollections.upsert(new ChannelResource(newDirectMessage), {
      httpOptions: { members: newUserDiscussion },
    });
    // Do not use this, this is cheating !
    // await ChannelsService.openDiscussion(newUserDiscussion);
    await MediumPopupComponent.closeAll();
  };

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
          onClick={() => upsertDirectMessage()}
        >
          {Languages.t('general.continue', [], 'Continue')}
        </Button>
      }
    >
      <div className="x-margin">
        <UserListManager
          users={[]}
          canRemoveMyself
          noPlaceholder
          scope="group"
          autoFocus
          onUpdate={(ids: string[]) => setNewUserDiscussion(ids)}
        />
      </div>
    </ObjectModal>
  );
};

export default NewDirectMessagesPopup;
