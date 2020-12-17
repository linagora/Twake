import React, { useState } from 'react';

import { Button, Col, Row, Typography } from 'antd';
import { Send, Trash } from 'react-feather';

import { ChannelMemberResource } from 'app/models/Channel';
import { getUserParts } from 'app/components/Member/UserParts';
import Languages from 'services/languages/languages.js';
import './MemberChannelRow.scss';
// import { useUsersListener } from 'app/components/Member/UserParts';

const { Text } = Typography;

type Props = {
  userId: string;
  inAddition?: boolean;
  collection?: any;
};

export default (props: Props) => {
  let userEvents: JSX.Element;
  const [isAlreadyMember, setIsAlreadyMember] = useState<boolean>(false);
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

    return setIsAlreadyMember(true);
  };

  if (props.inAddition) {
    const buttonStyle: { [key: string]: string } = {
      minWidth: '42px',
      height: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isAlreadyMember ? 'var(--grey-dark)' : '',
      backgroundColor: isAlreadyMember ? 'var(--grey-background)' : 'var(--primary)',
    };
    userEvents = (
      <Col>
        <Button
          type="primary"
          style={buttonStyle}
          disabled={isAlreadyMember}
          onClick={() => addUser(props.userId)}
        >
          {Languages.t('general.add')}
        </Button>
      </Col>
    );
  } else {
    userEvents = (
      <Col>
        <Send size={15} />
        <Trash size={15} />
      </Col>
    );
  }

  return (
    <Row key={`key_${props.userId}`} align="middle" gutter={[0, 16]}>
      <Col className="small-right-margin">{avatar}</Col>
      <Col flex={4}>
        <Text strong>{name}</Text> @{users[0].username}
      </Col>
      {userEvents}
    </Row>
  );
};
