import React, { useState, useEffect } from 'react';
import { Avatar, Badge } from 'antd';
import { User } from 'react-feather';

import UserService from 'services/user/user.js';
import UserListenerService from 'services/user/listen_users';
import OldCollections from 'services/Depreciated/Collections/Collections';
import { ChannelType } from 'app/models/Channel';
import UsersService from 'services/user/user.js';

export const useChannelListener = (channel: ChannelType) => {
  const channelMembers = (channel.direct_channel_members || []).filter(
    e =>
      (channel?.direct_channel_members?.length || 0) === 1 || e !== UsersService.getCurrentUserId(),
  );

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

  OldCollections.get('users').useListener(useState, channelMembers);
};

export const getChannelParts = (props: { channel: ChannelType }): [JSX.Element, string] => {
  const channelMembers = (props.channel.direct_channel_members || []).filter(
    e =>
      (props?.channel?.direct_channel_members?.length || 0) === 1 ||
      e !== UsersService.getCurrentUserId(),
  );

  let avatar: JSX.Element = <Avatar size={20} icon={<User size={12} style={{ margin: 4 }} />} />;
  let channelName: string[] = [];

  let users: { id: string; lastname: string; thumbnail: string }[] = [];

  channelMembers?.map(userId => users.push(OldCollections.get('users').find(userId)));

  if (channelMembers?.length === 1) {
    avatar = (
      <Badge size="default" dot offset={[-4, 16]}>
        <Avatar size={20} src={UserService.getThumbnail(users[0])} />
      </Badge>
    );
    channelName = [UserService.getFullName(users[0])];
  } else if (channelMembers?.length || 0 > 1) {
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
          channelName.push(UserService.getFullName(member));
          return <Avatar key={member.id} size={20} src={UserService.getThumbnail(member)} />;
        })}
      </Avatar.Group>
    );
  }

  return [avatar, channelName.join(', ')];
};
