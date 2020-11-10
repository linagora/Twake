import React, { useState, useEffect } from 'react';
import { Tooltip, Avatar, Badge } from 'antd';
import { User } from 'react-feather';

import './Channel.scss';
import UserService from 'services/user/user.js';
import UserListenerService from 'services/user/listen_users';
import OldCollections from 'services/Depreciated/Collections/Collections';
import { ChannelType } from 'app/models/Channel';
import ChannelUI from 'components/Leftbar/Channel/Channel';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  const channelMembers = props.channel.direct_channel_members;
  let avatar: JSX.Element = <Avatar size={25} icon={<User />} />;
  let usersName: string[] = [];
  let userName: string = '';

  let users: { id: string; lastname: string; thumbnail: string }[] = [];

  useEffect(() => {
    channelMembers?.map(userId => {
      UserListenerService.listenUser(userId);
      UserService.asyncGet(userId);
    });

    return () => {
      channelMembers?.map(userId => {
        UserListenerService.cancelListenUser(userId);
      });
    };
  }, []);

  channelMembers?.map(userId => users.push(OldCollections.get('users').find(userId)));

  OldCollections.get('users').useListener(useState, channelMembers);

  if (channelMembers?.length === 1) {
    avatar = (
      <Badge size="default" dot offset={[-4, 21]}>
        <Avatar size={25} src={UserService.getThumbnail(users[0])} />
      </Badge>
    );
    userName = UserService.getFullName(users[0]);
  } else {
    const firstUser = users[0];
    usersName.push(`${UserService.getFullName(firstUser)}, `);
    users = users.filter(user => user !== firstUser);
    avatar = (
      <Avatar.Group
        maxCount={3}
        maxStyle={{
          color: '#FFFFFF',
          backgroundColor: `var(--primary)`,
          width: '25px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {users.map(member => {
          usersName.push(`${UserService.getFullName(member)}, `);
          return <Avatar key={member.id} size={25} src={UserService.getThumbnail(member)} />;
        })}
        <Tooltip title="" placement="top">
          <Avatar key={firstUser.id} size={25} src={UserService.getThumbnail(firstUser)} />
        </Tooltip>
      </Avatar.Group>
    );

    userName = userName.concat(...usersName).slice(0, -2);
  }

  return (
    <>
      <ChannelUI
        name={userName}
        icon={avatar}
        selected={false}
        muted={false}
        favorite={false}
        unreadMessages={false}
        visibility="direct"
        notifications={0}
        options={{}}
      />
    </>
  );
};
