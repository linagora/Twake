import { Button } from 'antd';
import channel from 'app/components/RichTextEditor/plugins/channel';
import WritingLoader from 'app/components/WritingLoader/WritingLoader';
import useChannelWritingActivity, {
  useChannelWritingActivityEmit,
  useChannelWritingActivityState,
} from 'app/state/recoil/hooks/useChannelWritingActivity';
import { ThreadWritingActivitySelector } from 'app/state/recoil/selectors/ThreadWritingActivity';
import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { threadId } from 'worker_threads';

type PropsType = {
  channelId: string;
  threadId: string;
};

export default ({ channelId, threadId }: PropsType): JSX.Element => {
  const usersTest = useChannelWritingActivityState(channelId, threadId);

  console.log('+++ uersTest in isWriting :) ', usersTest);
  const [writtingInfo, setWritingInfo] = useState('');

  useEffect(() => {
    switch (usersTest.length) {
      case 0:
        setWritingInfo('');
        break;
      case 1:
        setWritingInfo(`${usersTest[0].name} is writing`);
        break;
      case 2:
        setWritingInfo(`${usersTest[0].name} and ${usersTest[1].name} are writing`);
        break;
      default:
        setWritingInfo(`${usersTest[0].name},  ${usersTest[1].name} and more are writing`);
        break;
    }
  }, [usersTest]);

  return usersTest.length > 0 ? (
    <div className="User-Wrting-info-MessageView ">{writtingInfo}</div>
  ) : (
    <></>
  );
};
