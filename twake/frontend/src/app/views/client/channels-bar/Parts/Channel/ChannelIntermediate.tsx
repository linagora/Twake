import React, { useState, useEffect } from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';
import { ChannelType } from 'app/features/channels/types/channel';
import { Collection } from 'app/deprecated/CollectionsReact/Collections';
import { getUserParts } from 'app/components/member/user-parts';
import { NotificationResource } from 'app/features/users/types/notification-types';
import _ from 'lodash';
import { useChannelWritingActivityState } from 'app/features/channels/hooks/use-channel-writing-activity';
import useRouterChannelSelected from 'app/features/router/hooks/use-router-channel-selected';

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

  const notifications = Collection.get(
    '/notifications/v1/badges/',
    NotificationResource,
  ).useWatcher({ channel_id: props.channel.id });
  const { avatar, name } = isDirectChannel
    ? getUserParts({
        usersIds: props.channel.members || [],
        displayOnline: true,
      })
    : { avatar: '', name: '' };

  const unreadMessages =
    (channel.last_activity || 0) !== 0 &&
    (channel.last_activity || 0) > (channel?.user_member?.last_access || 0) &&
    channel.last_message?.sender !== channel.user_member?.user_id &&
    !(isDirectChannel && notifications.length === 0);

  const channelIcon = isDirectChannel ? avatar : channel.icon || '';
  const channelName = isDirectChannel ? name : channel.name || '';

  return (
    <ChannelUI
      name={channelName}
      icon={channelIcon}
      muted={channel.user_member?.notification_level === 'none'}
      favorite={channel.user_member?.favorite || false}
      unreadMessages={unreadMessages}
      writingActivity={writingActivity.length > 0}
      visibility={channel.visibility || 'public'}
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
