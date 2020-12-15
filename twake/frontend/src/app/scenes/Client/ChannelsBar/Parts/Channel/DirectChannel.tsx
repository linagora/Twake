import React from 'react';

import './Channel.scss';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import ChannelUI from 'app/scenes/Client/ChannelsBar/Parts/Channel/Channel';
import { Collection } from 'app/services/CollectionsReact/Collections';
import { getUserParts, useUsersListener } from 'app/components/Member/UserParts';
import ChannelMenu from 'app/scenes/Client/ChannelsBar//Parts/Channel/ChannelMenu';

type Props = {
  collection: Collection<ChannelResource>;
  channel: ChannelResource;
};

export default (props: Props) => {
  useUsersListener(props.channel.data.direct_channel_members || []);
  const { avatar, name } = getUserParts({
    usersIds: props.channel.data.direct_channel_members || [],
  });
  const menu = (channel: ChannelResource) => {
    if (!channel) return <></>;
    return <ChannelMenu channel={channel} />;
  };

  return (
    <>
      <ChannelUI
        collection={props.collection}
        name={name || 'Loading...'}
        icon={avatar}
        muted={false}
        favorite={false}
        unreadMessages={false}
        visibility="direct"
        notifications={0}
        id={props.channel.id}
        showTooltip={(props.channel.data.direct_channel_members?.length || 0) > 2}
        menu={menu(props.channel)}
      />
    </>
  );
};
