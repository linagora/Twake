import React, { useEffect, useState } from 'react';

import { useChannelWritingActivityState } from 'app/features/channels/hooks/use-channel-writing-activity';
import Languages from 'app/features/global/services/languages-service';
import WritingLoader from 'app/components/writing-loader/writing-loader';
import { ChannelWritingActivityType } from 'app/features/channels/state/channel-writing-activity';

type PropsType = {
  channelId: string;
  threadId: string;
};

const getChannelActivityMessage = (channelActivityUsers: ChannelWritingActivityType[]) => {
  const channelActivityUsersCount = channelActivityUsers.length;
  let channelActivityMessage = '';

  if (channelActivityUsersCount === 1) {
    channelActivityMessage = Languages.t(
      'scenes.app.messages.input.parts.is_writing.message.user_is_writing',
      [channelActivityUsers[0].name],
    );
  }

  if (channelActivityUsersCount === 2) {
    channelActivityMessage = Languages.t(
      'scenes.app.messages.input.parts.is_writing.message.users_are_writing',
      [channelActivityUsers[0].name, channelActivityUsers[1].name],
    );
  }

  if (channelActivityUsersCount > 2) {
    channelActivityMessage = Languages.t(
      'scenes.app.messages.input.parts.is_writing.message.users_and_more_are_writing',
      [channelActivityUsers[0].name, channelActivityUsers[1].name, channelActivityUsersCount - 2],
    );
  }

  return channelActivityMessage;
};

export default ({ channelId, threadId }: PropsType): JSX.Element => {
  const channelActivityUsers = useChannelWritingActivityState(channelId, threadId);
  const [writtingInfo, setWritingInfo] = useState('');

  useEffect(() => {
    const message = getChannelActivityMessage(channelActivityUsers);

    setWritingInfo(message);
  }, [channelActivityUsers]);

  return writtingInfo.length > 0 ? (
    <div className="user-writing-info-message-view">
      <div className="user-writing-info-message-view-inner">
        <WritingLoader /> <div className="small-left-margin">{writtingInfo}</div>
      </div>
    </div>
  ) : (
    <></>
  );
};
