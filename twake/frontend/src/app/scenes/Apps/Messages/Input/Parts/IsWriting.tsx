import React, { useEffect, useState } from 'react';

import { useChannelWritingActivityState } from 'app/state/recoil/hooks/useChannelWritingActivity';

type PropsType = {
  channelId: string;
  threadId: string;
};

export default ({ channelId, threadId }: PropsType): JSX.Element => {
  const users = useChannelWritingActivityState(channelId, threadId);
  const [writtingInfo, setWritingInfo] = useState('');

  useEffect(() => {
    switch (users.length) {
      case 0:
        setWritingInfo('');
        break;
      case 1:
        setWritingInfo(`${users[0].name} is writing...`);
        break;
      case 2:
        setWritingInfo(`${users[0].name} and ${users[1].name} are writing...`);
        break;
      default:
        setWritingInfo(`${users[0].name}, ${users[1].name} and more are writing...`);
        break;
    }
  }, [users]);

  return users.length > 0 ? (
    <div className="user-writing-info-message-view">{writtingInfo}</div>
  ) : (
    <></>
  );
};
