import React, { useState, useEffect } from 'react';
import { Typography, Col } from 'antd';

import { ChannelType } from 'app/models/Channel';
import { getUserParts, useUsersListener } from 'app/components/Member/UserParts';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useUsersListener(props.channel.direct_channel_members || props.channel.members || []);
  const { avatar, name } = getUserParts({
    usersIds: props.channel.direct_channel_members || props.channel.members || [],
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
