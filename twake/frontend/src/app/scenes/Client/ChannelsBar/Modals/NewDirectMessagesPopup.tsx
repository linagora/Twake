import React, { FC, useState } from 'react';

import Languages from 'services/languages/languages';
import MediumPopupComponent from 'app/components/Modal/ModalManager';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import UserListManager from 'components/UserListManager/UserListManager';
import RouterServices from 'app/services/RouterService';
import ChannelsService from 'services/channels/channels.js';
import ModalManager from 'app/components/Modal/ModalManager';
import { Button, Typography } from 'antd';
import ChannelWorkspaceEditor from 'scenes/Client/ChannelsBar/Modals/ChannelWorkspaceEditor';
import { Trans } from 'react-i18next';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { companyId } = RouterServices.getStateFromRoute();

  const upsertDirectMessage = async (): Promise<any> => {
    setLoading(true);
    await ChannelsService.openDiscussion(newUserDiscussion, companyId);
    return MediumPopupComponent.closeAll();
  };

  const onClickLink = () => {
    ModalManager.closeAll();
    return ModalManager.open(
      <ChannelWorkspaceEditor
        title={'scenes.app.channelsbar.channelsworkspace.create_channel'}
        defaultVisibility="private"
      />,
      {
        position: 'center',
        size: { width: '600px' },
      },
    );
  };

  const max = 10;
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
          disabled={newUserDiscussion.length === 0 || newUserDiscussion.length > max}
          onClick={upsertDirectMessage}
        >
          {Languages.t('general.continue', [], 'Continue')}
        </Button>
      }
    >
      <div className="x-margin">
        <UserListManager
          max={max}
          disabled={newUserDiscussion.length >= max}
          inputText={
            newUserDiscussion.length >= max
              ? Languages.t(
                  'scenes.app.channelsbar.channelsuser.new_private_discussion.limit_reached_input_placeholder',
                )
              : undefined
          }
          users={[]}
          canRemoveMyself
          noPlaceholder
          scope="group"
          autoFocus
          onUpdate={(ids: string[]) => setNewUserDiscussion(ids)}
        />

        <>
          {newUserDiscussion.length >= max && (
            <Typography.Text>
              <Typography.Link onClick={onClickLink}>
                {Languages.t(
                  'scenes.app.channelsbar.channelsuser.new_private_discussion.limit_reached_link',
                )}
              </Typography.Link>
              <Typography.Text>
                {Languages.t(
                  'scenes.app.channelsbar.channelsuser.new_private_discussion.limit_reached_text',
                )}
              </Typography.Text>
            </Typography.Text>
          )}
        </>
      </div>
    </ObjectModal>
  );
};

export default NewDirectMessagesPopup;
