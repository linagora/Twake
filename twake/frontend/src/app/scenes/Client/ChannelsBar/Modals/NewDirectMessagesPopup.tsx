import React, { FC, useState } from 'react';

import Languages from 'services/languages/languages.js';
import MediumPopupComponent from 'app/components/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import UserListManager from 'components/UserListManager/UserListManager';
import RouterServices from 'app/services/RouterService';
import ChannelsService from 'services/channels/channels.js';
import { Button } from 'antd';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { companyId } = RouterServices.useRouteState(({ companyId }) => {
    return { companyId };
  });

  const upsertDirectMessage = async (): Promise<any> => {
    setLoading(true);
    await ChannelsService.openDiscussion(newUserDiscussion, companyId);
    return MediumPopupComponent.closeAll();
  };

  return (
    <ObjectModal
      title={Languages.t('scenes.app.channelsbar.channelsuser.new_private_discussion')}
      closable
      footer={
        <Button
          loading={loading}
          block={true}
          type="primary"
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
          max={10}
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
