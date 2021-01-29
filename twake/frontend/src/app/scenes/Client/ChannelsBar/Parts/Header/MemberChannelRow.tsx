import React, { useState } from 'react';

import { Button, Col, Row, Typography } from 'antd';
import { Trash } from 'react-feather';

import { ChannelMemberResource } from 'app/models/Channel';
import { getUserParts } from 'app/components/Member/UserParts';
import Languages from 'services/languages/languages.js';
import './MemberChannelRow.scss';
import Menu from 'app/components/Menus/Menu';
import Icon from 'app/components/Icon/Icon';
// import { useUsersListener } from 'app/components/Member/UserParts';

const { Text } = Typography;

type Props = {
  userId: string;
  channelMemberResource?: ChannelMemberResource;
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
    if (userId) {
      await props.collection.upsert(
        new ChannelMemberResource({
          user_id: userId,
          type: 'member', // "member" | "guest" | "bot",
        }),
      );

      return setIsAlreadyMember(true);
    }
  };

  const leaveChannel = async () => {
    //Fixme, this is not pretty, we should find a way to do this in one line
    props.channelMemberResource?.setPersisted();
    await props.collection.upsert(props.channelMemberResource, { withoutBackend: true });
    return await props.collection.remove(props.channelMemberResource);
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
    let menu: any = [
      {
        text: (
          <div style={{ color: 'var(--red)' }}>
            {Languages.t('scenes.client.channelbar.channelmemberslist.menu.option_2')}
          </div>
        ),
        icon: <Trash size={16} color="var(--red)" />,
        onClick: leaveChannel,
      },
    ];
    userEvents = (
      <Col>
        <div className="more-icon">
          <Menu menu={menu} className="options">
            <Icon type="ellipsis-h more-icon grey-icon" />
          </Menu>
        </div>
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
