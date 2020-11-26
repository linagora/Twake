import React from 'react';

import './Channel.scss';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import ChannelUI from 'app/scenes/Client/ChannelsBar/Parts/Channel/Channel';
import { Collection } from 'app/services/CollectionsReact/Collections';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';

type Props = {
  collection: Collection<ChannelResource>;
  channel: ChannelType;
};

export default (props: Props) => {
  useChannelListener(props.channel);
  const [avatar, name] = getChannelParts({ channel: props.channel });

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
      />
    </>
  );
};
