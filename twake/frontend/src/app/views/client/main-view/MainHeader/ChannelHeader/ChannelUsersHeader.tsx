import React from 'react';
import { Typography, Col } from 'antd';

import { ChannelType } from 'app/features/channels/types/channel';
import { getUserParts } from 'app/components/member/user-parts';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useUsersListener(props.channel.members);
  const { avatar, name } = getUserParts({
    usersIds: props.channel.members || [],
  });

  return (
    <Col>
      <span className="left-margin text-overflow" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="small-right-margin" style={{ lineHeight: 0 }}>
          {avatar}
        </div>
        <Typography.Text
          className="small-right-margin"
          style={{ textTransform: 'capitalize' }}
          strong
        >
          {name}
        </Typography.Text>
      </span>
    </Col>
  );
};
