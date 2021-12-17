import { Button } from 'antd';
import useChannelActivityWriting from 'app/state/recoil/hooks/useChannelWritingActivity';
import React from 'react';

type PropsType = {
  channelId: string;
  threaId: string;
};

export default ({ channelId, threaId }: PropsType): JSX.Element => {
  const { users } = useChannelActivityWriting(channelId, threaId);

  return (
    <div style={{ height: '40px', backgroundColor: 'pink' }}>
      <Button>{users.map(user => user.name)} is writing</Button>
    </div>
  );
};
