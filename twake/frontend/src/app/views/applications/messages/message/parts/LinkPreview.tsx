import React from 'react';
import { Card, Avatar } from 'antd';
import { MessageLinkType } from 'app/features/messages/types/message';

const { Meta } = Card;

type PropsType = {
  preview: MessageLinkType;
};

export default ({ preview }: PropsType): React.ReactElement => (
  <Card
    style={{
      borderLeft: '3px solid #d9d9d9',
      width: '450px',
      marginTop: '10px',
    }}
    size="small"
    type="inner"
    cover={
      <img
        alt={preview.title}
        width={preview.img_width}
        height={preview.img_height}
        style={{
          marginLeft: '1px',
          maxHeight: '240px',
          maxWidth: '450px',
        }}
        src={preview.img}
      />
    }
  >
    <Meta
      avatar={<Avatar src={preview.favicon} />}
      title={preview.title}
      description={preview.description}
    />
  </Card>
);
