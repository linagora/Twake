import { useChannelWritingActivityState } from 'app/state/recoil/hooks/useChannelWritingActivity';
import React, { useEffect, useState } from 'react';

type PropsType = {
  channelId: string;
  threadId: string;
};

export default ({ channelId, threadId }: PropsType): JSX.Element => {
  const usersTest = useChannelWritingActivityState(channelId, threadId);

  const [writtingInfo, setWritingInfo] = useState('');

  useEffect(() => {
    switch (usersTest.length) {
      case 0:
        setWritingInfo('');
        break;
      case 1:
        setWritingInfo(`${usersTest[0].name} is writing...`);
        break;
      case 2:
        setWritingInfo(`${usersTest[0].name} and ${usersTest[1].name} are writing...`);
        break;
      default:
        setWritingInfo(`${usersTest[0].name},  ${usersTest[1].name} and more are writing...`);
        break;
    }
  }, [usersTest]);

  return usersTest.length > 0 ? (
    <div className="user-writing-info-message-view">{writtingInfo}</div>
  ) : (
    <></>
  );
};
