import React, { useState, useEffect } from 'react';
import { Typography, Col } from 'antd';

import { ChannelType } from 'app/models/Channel';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useChannelListener(props.channel.direct_channel_members || []);
  const [avatar, name] = getChannelParts({ usersIds: props.channel.direct_channel_members || [] });

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
