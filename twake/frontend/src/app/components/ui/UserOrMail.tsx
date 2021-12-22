import React, { useEffect, useState } from 'react';
import { Avatar, Col, Typography } from 'antd';
import UsersService from 'services/user/UserService';
import Collections from 'app/services/Depreciated/Collections/Collections';
import './elements.scss';
import { UserType } from 'app/models/User';
import UserAPIClient from 'app/services/user/UserAPIClient';

const { Text } = Typography;

type PropsType = {
  item: any;
};

const EmailRow = ({ email }: { email: string }): JSX.Element => {
  return (
    <>
      <div className="icon">
        <div className="user_head email">{email.indexOf('+') === 0 ? email : '@'}</div>
      </div>
      <div className="text" style={{ fontStyle: 'italic' }}>
        {email}
      </div>
    </>
  );
};

const UserRow = ({ id }: { id: string }): JSX.Element => {
  const collection = Collections.get('users');
  const [user, setUser] = useState<UserType>();

  const handleUser = async () => {
    const u = (await UserAPIClient.list([id]))[0];

    if (u) setUser(u);
  };

  useEffect(() => {
    handleUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = collection.addListener(useState, [user]);

    return () => {
      collection.removeListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return user ? (
    <>
      <Col className="icon">
        <Avatar size={20} src={UsersService.getThumbnail(user)} />
      </Col>
      <Col className="text" flex="auto">
        <Text strong>{UsersService.getFullName(user)}</Text>
        <Text>{user.email ? `, ${user.email}` : ''}</Text>
      </Col>
    </>
  ) : (
    <></>
  );
};

export default (props: PropsType): JSX.Element => {
  const id = props.item.id || props.item;

  if (
    typeof props.item == 'string' &&
    (props.item.indexOf('@') >= 0 || props.item.indexOf('+') === 0)
  ) {
    return <EmailRow email={props.item} />;
  } else {
    return <UserRow id={id} />;
  }
};
