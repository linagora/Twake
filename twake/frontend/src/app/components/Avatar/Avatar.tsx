import React from 'react';

import { Avatar, AvatarProps, Image } from 'antd';

import './Avatar.scss';

type PropsType = {
  url: string;
  size?: number;
  shape?: AvatarProps['shape'];
};

const AvatarComponent = ({ url, shape, size }: PropsType) => (
  <Avatar
    className="avatar-component-container"
    shape={shape || 'square'}
    src={
      <Image
        src={url}
        style={{ width: size || 24, height: size || 24, borderRadius: 4 }}
        preview={false}
      />
    }
  />
);

export default AvatarComponent;
