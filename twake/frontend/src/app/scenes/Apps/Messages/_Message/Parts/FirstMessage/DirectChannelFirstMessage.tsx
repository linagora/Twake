import React from 'react';
import Languages from 'services/languages/languages';
import './FirstMessage.scss';
import { ChannelType } from 'app/models/Channel';
import { getUserParts } from 'app/components/Member/UserParts';
import { useUsersListener } from 'app/services/user/hooks/useUsersListener';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useUsersListener(props.channel.members);
  const { avatar, name } = getUserParts({
    usersIds: props.channel.members || [],
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
          'This is the first message',
        )}
      </div>
    </div>
  );
};
