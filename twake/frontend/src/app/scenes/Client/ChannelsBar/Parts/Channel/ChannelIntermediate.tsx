import React, { useState } from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import { getUserParts } from 'app/components/Member/UserParts';
import { NotificationResource } from 'app/models/Notification';
import { useUsersListener } from 'app/services/user/hooks/useUsersListener';

type Props = {
  channel: ChannelType;
  collection: Collection<ChannelResource>;
};

export default (props: Props): JSX.Element => {
  const [isActive, setActive] = useState<boolean>(false);
  const isDirectChannel = props.channel.visibility === 'direct';

  const menu = (channel: ChannelResource) => {
    if (!channel) return <></>;
    return (
      <ChannelMenu
        channel={channel}
        onClick={() => setActive(true)}
        onClose={() => setActive(false)}
      />
    );
  };

  const channel = props.collection.useWatcher(
    { id: props.channel.id },
    { query: { mine: true } },
  )[0];

  //Fixme: find a better way to reload channels if we have only part of it (maily when invited by other members)
  if (!channel?.data?.visibility && channel?.data?.user_member?.user_id) {
    props.collection.reload('ontime');
  }

  useUsersListener(props.channel.members);

  const notifications = Collection.get('/notifications/v1/badges/', NotificationResource).useWatcher({ channel_id: props.channel.id });
  const { avatar, name } = isDirectChannel
    ? getUserParts({
        usersIds: props.channel.members || [],
        displayOnline: true,
      })
    : { avatar: '', name: '' };

  if (!channel || !channel.data.user_member?.user_id || !channel.state.persisted) return <></>;

  const channelIcon = isDirectChannel ? avatar : channel.data.icon || '';
  const channeName = isDirectChannel ? name : channel.data.name || '';

  const unreadMessages =
    (channel.data.last_activity || 0) > (channel.data.user_member.last_access || 0) &&
    channel.data.last_message?.sender !== channel.data.user_member?.user_id;

  return (
    <ChannelUI
      collection={props.collection}
      name={channeName}
      icon={channelIcon}
      muted={channel.data.user_member?.notification_level === 'none'}
      favorite={channel.data.user_member?.favorite || false}
      unreadMessages={unreadMessages && channel.data.user_member.notification_level !== 'none'}
      visibility={channel.data.visibility || 'public'}
      notifications={notifications.length || 0}
      menu={menu(channel)}
      active={isActive}
      id={channel.data.id}
    />
  );
};
