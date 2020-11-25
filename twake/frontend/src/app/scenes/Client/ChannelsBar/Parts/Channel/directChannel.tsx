import React, { useState, useEffect } from 'react';
import { Tooltip, Avatar, Badge } from 'antd';
import { User } from 'react-feather';
import RouterService from 'app/services/RouterService';

import './Channel.scss';
import UserService from 'services/user/user.js';
import UserListenerService from 'services/user/listen_users';
import OldCollections from 'services/Depreciated/Collections/Collections';
import { ChannelResource, ChannelType } from 'app/models/Channel';
import ChannelUI from 'app/scenes/Client/ChannelsBar/Parts/Channel/Channel';
import { Collection } from 'app/services/CollectionsReact/Collections';

type Props = {
  collection: Collection<ChannelResource>;
  channel: ChannelType;
};

export default (props: Props) => {
  const channelMembers = props.channel.direct_channel_members;
  let avatar: JSX.Element = <Avatar size={20} icon={<User size={12} style={{ margin: 4 }} />} />;
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
      <Badge size="default" dot offset={[-4, 16]}>
        <Avatar size={20} src={UserService.getThumbnail(users[0])} />
      </Badge>
    );
    userName = UserService.getFullName(users[0]);
  } else if (channelMembers?.length || 0 > 1) {
    const firstUser = users[0];
    usersName.push(`${UserService.getFullName(firstUser)}, `);
    users = users.filter(user => user !== firstUser);
    avatar = (
      <Avatar.Group
        maxCount={3}
        maxStyle={{
          color: '#FFFFFF',
          backgroundColor: `var(--primary)`,
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {users.map(member => {
          usersName.push(`${UserService.getFullName(member)}, `);
          return <Avatar key={member.id} size={20} src={UserService.getThumbnail(member)} />;
        })}
        <Tooltip title="" placement="top">
          <Avatar key={firstUser.id} size={20} src={UserService.getThumbnail(firstUser)} />
        </Tooltip>
      </Avatar.Group>
    );

    userName = userName.concat(...usersName).slice(0, -2);
  }

  return (
    <>
      <ChannelUI
        collection={props.collection}
        name={userName}
        icon={avatar}
        muted={false}
        favorite={false}
        unreadMessages={false}
        visibility="direct"
        notifications={0}
        id={props.channel.id}
      />
    </>
  );
};
