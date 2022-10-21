import { useState } from 'react';

import { Button } from '@atoms/button/button';
import { Typography } from 'antd';
import { ModalContent } from 'app/atoms/modal';
import { useOpenChannelModal } from 'app/components/edit-channel';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import Languages from 'app/features/global/services/languages-service';
import SelectUsers from './select-users';
import './style.scss';

export default (props: { onClose: () => void }) => {
  const [newUserDiscussion, setNewUserDiscussion] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { openDiscussion } = useDirectChannels();
  const openChannelModal = useOpenChannelModal();

  const upsertDirectMessage = async (): Promise<void> => {
    setLoading(true);
    await openDiscussion(newUserDiscussion);
    props.onClose();
  };

  const onClickLink = () => {
    props.onClose();
    openChannelModal('');
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
