import React, { useState, useEffect } from 'react';

import ChannelUI from './Channel';
import ChannelMenu from './ChannelMenu';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import { getUserParts } from 'app/components/Member/UserParts';
import { NotificationResource } from 'app/models/Notification';
import { useUsersListener } from 'app/services/user/hooks/useUsersListener';
import { useSetChannel } from 'app/state/recoil/hooks/channels/useChannel';
import _ from 'lodash';

type Props = {
  channel: ChannelType;
  collection: Collection<ChannelResource>;
};

export default (props: Props): JSX.Element => {
  const [isActive, setActive] = useState<boolean>(false);
  const isDirectChannel = props.channel.visibility === 'direct';

  const { set } = useSetChannel();
  useEffect(() => {
    set(_.cloneDeep(props.channel));
  }, [props.channel]);

  const menu = (channel: ChannelType) => {
    if (!channel) return <></>;
    return (
      <ChannelMenu
        channel={channel}
        onClick={() => setActive(true)}
        onClose={() => setActive(false)}
      />
    );
  };

  const channel = props.channel;

  //Fixme: find a better way to reload channels if we have only part of it (maily when invited by other members)
  if (!channel?.visibility && channel?.user_member?.user_id) {
    props.collection.reload('ontime');
  }

  useUsersListener(props.channel.members);

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

  if (!channel || !channel.user_member?.user_id) return <></>;

  const channelIcon = isDirectChannel ? avatar : channel.icon || '';
  const channeName = isDirectChannel ? name : channel.name || '';

  const unreadMessages =
    (channel.last_activity || 0) > (channel.user_member.last_access || 0) &&
    channel.last_message?.sender !== channel.user_member?.user_id;

  return (
    <ChannelUI
      collection={props.collection}
      name={channeName}
      icon={channelIcon}
      muted={channel.user_member?.notification_level === 'none'}
      favorite={channel.user_member?.favorite || false}
      unreadMessages={unreadMessages && channel.user_member.notification_level !== 'none'}
      visibility={channel.visibility || 'public'}
      notifications={notifications.length || 0}
      menu={menu(channel)}
      active={isActive}
      id={channel.id}
    />
  );
};
