import React, { useState } from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';
import { ChannelType } from 'app/features/channels/types/channel';
import { getUserParts } from 'app/components/member/user-parts';
import { useChannelWritingActivityState } from 'app/features/channels/hooks/use-channel-writing-activity';
import useRouterChannelSelected from 'app/features/router/hooks/use-router-channel-selected';
import { useChannelNotifications } from 'app/features/users/hooks/use-notifications';

type Props = {
  channel: ChannelType;
};

export default (props: Props): JSX.Element => {
  const channel = props.channel;
  if (!channel || !channel.user_member?.user_id) return <></>;

  const isDirectChannel = props.channel.visibility === 'direct';

  const [isActive, setActive] = useState<boolean>(false);
  const selected = useRouterChannelSelected(props.channel.id || '');
  const writingActivity = useChannelWritingActivityState(props.channel.id || '');
  const { badges: notifications } = useChannelNotifications(props.channel.id || '');
  const { avatar, name } = isDirectChannel
    ? getUserParts({
        usersIds: props.channel.members || [],
        displayOnline: true,
      })
    : { avatar: '', name: '' };

  const unreadMessages = Math.max(
    0,
    (channel.stats?.messages || 0) - (channel.user_member.last_increment || 0),
  );

  const channelIcon = isDirectChannel ? avatar : channel.icon || '';
  const channelName = isDirectChannel ? name : channel.name || '';

  return (
    <ChannelUI
      name={channelName}
      icon={channelIcon}
      notificationLevel={channel.user_member?.notification_level || 'mentions'}
      favorite={channel.user_member?.favorite || false}
      writingActivity={writingActivity.length > 0}
      visibility={channel.visibility || 'public'}
      unreadMessages={unreadMessages}
      notifications={notifications.length || 0}
      selected={selected}
      menu={
        <ChannelMenu
          channel={channel}
          onClick={() => setActive(true)}
          onClose={() => setActive(false)}
        />
      }
      active={isActive}
      id={channel.id}
    />
  );
};
