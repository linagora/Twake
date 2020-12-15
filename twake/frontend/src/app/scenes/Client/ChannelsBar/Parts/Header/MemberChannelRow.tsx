import React from 'react';

import { Col, Row, Typography } from 'antd';
import { PlusCircle, Send, Trash } from 'react-feather';

import { ChannelMemberResource } from 'app/models/Channel';
import { getUserParts } from 'app/components/Member/UserParts';
// import { useUsersListener } from 'app/components/Member/UserParts';

const { Text } = Typography;

type Props = {
  userId: string;
  inAddition?: boolean;
  collection?: any;
};

export default (props: Props) => {
  let userEvents: JSX.Element;

  // useUsersListener([props.userId] || []);

  const { avatar, name, users } = getUserParts({
    usersIds: [props.userId] || [],
    max: 6,
    size: 24,
  });

  const addUser = async (userId: string) => {
    await props.collection.upsert(
      new ChannelMemberResource({
        user_id: userId,
        type: 'member', // "member" | "guest" | "bot",
      }),
    );
  };

  if (props.inAddition) {
    userEvents = (
      <Col>
        {/* Need some style. Prevent click when member already   */}
        <PlusCircle onClick={() => addUser(props.userId)} size={20} style={{ margin: 4 }} />
      </Col>
    );
  } else {
    userEvents = (
      <Col>
        {/* Need some style */}
        <Send size={15} style={{ margin: 4 }} />
        <Trash size={15} style={{ margin: '0 15px 4px 4px' }} />
      </Col>
    );
  }

  return (
    <Row key={`key_${props.userId}`} align="middle" justify="start" gutter={[8, 8]}>
      <Col>{avatar}</Col>
      <Col flex={4}>
        <Text strong>{name}</Text> @{users[0].username}
      </Col>
      {userEvents}
    </Row>
  );
};
