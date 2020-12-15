import React, { FC, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import MediumPopupComponent from 'app/components/Modal/ModalManager';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/DeprecatedObjectModal.js';
import UserListManager from 'components/UserListManager/UserListManager';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import Collections from 'app/services/CollectionsReact/Collections';
import UsersService from 'services/user/user.js';
import RouterServices from 'app/services/RouterService';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);

  const { workspaceId, companyId } = RouterServices.useStateFromRoute();
  const company_id = companyId;

  const collectionPath: string = `/channels/v1/companies/${company_id}/workspaces/direct/channels/`;
  const ChannelsCollections = Collections.get(collectionPath, ChannelResource);

  const upsertDirectMessage = async (): Promise<any> => {
    let membersIds = newUserDiscussion;
    membersIds.push(UsersService.getCurrentUserId());
    membersIds = membersIds.filter((e, index) => newUserDiscussion.indexOf(e) === index);

    const newDirectMessage: ChannelType = {
      company_id: company_id,
      workspace_id: workspaceId,
      visibility: 'direct',
      direct_channel_members: membersIds,
    };

    await ChannelsCollections.upsert(new ChannelResource(newDirectMessage), {
      query: { members: membersIds },
    });

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
