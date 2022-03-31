import React, { FC, useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import MediumPopupComponent from 'app/components/modal/modal-manager';
import ObjectModal from 'components/object-modal/object-modal';
import UserListManager from 'components/user-list-manager/user-list-manager';
import ModalManager from 'app/components/modal/modal-manager';
import { Button, Typography } from 'antd';
import ChannelWorkspaceEditor from 'app/views/client/channels-bar/Modals/ChannelWorkspaceEditor';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';

const NewDirectMessagesPopup: FC = () => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { openDiscussion } = useDirectChannels();

  const upsertDirectMessage = async (): Promise<any> => {
    setLoading(true);
    await openDiscussion(newUserDiscussion);
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
          scope="company"
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
