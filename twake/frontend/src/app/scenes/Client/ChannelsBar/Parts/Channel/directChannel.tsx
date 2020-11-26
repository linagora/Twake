import React from 'react';

import './Channel.scss';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import ChannelUI from 'app/scenes/Client/ChannelsBar/Parts/Channel/Channel';
import { Collection } from 'app/services/CollectionsReact/Collections';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';
import ChannelMenu from 'app/scenes/Client/ChannelsBar//Parts/Channel/ChannelMenu';

type Props = {
  collection: Collection<ChannelResource>;
  channel: ChannelType;
};

export default (props: Props) => {
  useChannelListener(props.channel.direct_channel_members || []);
  const [avatar, name] = getChannelParts({ usersIds: props.channel.direct_channel_members || [] });
  const menu = (channel: ChannelType) => {
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
        showTooltip={(props.channel?.direct_channel_members?.length || 0) > 2}
        menu={menu(props.channel)}
      />
    </>
  );
};
