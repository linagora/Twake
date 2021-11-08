import React from 'react';

import { Avatar, AvatarProps, Image } from 'antd';

import './Avatar.scss';

type PropsType = {
  url: string;
  size?: number;
  shape?: AvatarProps['shape'];
  borderRadius?: React.CSSProperties['borderRadius'];
};

const AvatarComponent = ({ url, shape, size, borderRadius }: PropsType) => (
  <Avatar
    className="avatar-component-container"
    shape={shape || 'square'}
    size={size}
    style={{ width: size || 24, height: 24 }}
    src={
      <Image
        src={url}
        style={{ width: size || 24, borderRadius: borderRadius || 4 }}
        preview={false}
      />
    }
  />
);

export default AvatarComponent;
