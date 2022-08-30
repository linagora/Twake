import React, { useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import ModalManager from 'app/components/modal/modal-manager';
import { Typography } from 'antd';
import ChannelWorkspaceEditor from 'app/views/client/channels-bar/Modals/ChannelWorkspaceEditor';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import SelectUsers from './select-users';
import './style.scss';
import { Button } from '@atoms/button/button';
import { ModalContent } from 'app/atoms/modal';

export default (props: { onClose: () => void }) => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { openDiscussion } = useDirectChannels();

  const upsertDirectMessage = async (): Promise<void> => {
    setLoading(true);
    await openDiscussion(newUserDiscussion);
    props.onClose();
  };

  const onClickLink = () => {
    props.onClose();
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
    <ModalContent title={Languages.t('scenes.app.channelsbar.channelsuser.new_private_discussion')}>
      <SelectUsers
        onChange={users => setNewUserDiscussion(users.map(u => u.id as string))}
        initialUsers={[]}
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
      <Button
        loading={loading}
        theme="primary"
        size="md"
        className="mt-4 float-right"
        disabled={newUserDiscussion.length === 0 || newUserDiscussion.length > max}
        onClick={upsertDirectMessage}
      >
        {Languages.t('general.continue', [], 'Continue')}
      </Button>
    </ModalContent>
  );
};
