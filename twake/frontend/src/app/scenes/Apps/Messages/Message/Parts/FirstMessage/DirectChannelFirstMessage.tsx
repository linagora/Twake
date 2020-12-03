import React from 'react';
import Languages from 'services/languages/languages.js';
import './FirstMessage.scss';
import { ChannelType } from 'app/models/Channel';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useChannelListener(props.channel.direct_channel_members || []);
  const [avatar, name] = getChannelParts({
    usersIds: props.channel.direct_channel_members || [],
    max: 6,
    size: 64,
  });

  return (
    <div className="content">
      <div className="channel_first_message_icon bottom-margin">{avatar}</div>
      <div className="title">{name}</div>
      <div className="text">
        {Languages.t(
          'scenes.apps.messages.message.types.first_message_text',
          [],
          "C'est le premier message",
        )}
      </div>
    </div>
  );
};
