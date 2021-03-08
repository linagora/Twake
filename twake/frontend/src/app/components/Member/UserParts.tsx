import React, { useState, useEffect } from 'react';
import { Avatar, Badge } from 'antd';
import { DashOutlined } from '@ant-design/icons';
import { User } from 'react-feather';

import { UserType } from 'app/models/User';
import UserService from 'services/user/user.js';
import UserListenerService from 'services/user/listen_users';
import OldCollections from 'services/Depreciated/Collections/Collections';
import UsersService from 'services/user/user.js';
import { isArray } from 'lodash';

export const useUsersListener = (usersIds: string[]) => {
  const channelMembers = (isArray(usersIds) ? usersIds : []).filter(
    e => (usersIds.length || 0) === 1 || e !== UsersService.getCurrentUserId(),
  );
  OldCollections.get('users').useListener(useState, channelMembers);

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
};

export const getUserParts = (props: {
  usersIds: string[];
  keepMyself?: boolean;
  max?: number;
  size?: number;
}): { avatar: JSX.Element; name: string; users: UserType[] } => {
  let channelMembers = (props.usersIds || []).filter(
    e =>
      props.keepMyself ||
      (props.usersIds.length || 0) === 1 ||
      e !== UsersService.getCurrentUserId(),
  );
  channelMembers = channelMembers.filter((e, i) => channelMembers.indexOf(e) === i);

  let avatar: JSX.Element = (
    <Avatar size={props.size || 20} icon={<User size={12} style={{ margin: 4 }} />} />
  );
  let channelName: string[] = [];

  let users: UserType[] = [];

  channelMembers?.map(userId => users.push(OldCollections.get('users').find(userId)));

  if (channelMembers?.length === 1) {
    avatar = (
      <Badge count={0} size="default" dot offset={[-4, 16]}>
        <Avatar size={props.size || 20} src={UserService.getThumbnail(users[0])} />
      </Badge>
    );
    channelName = [UserService.getFullName(users[0])];
  } else if (channelMembers?.length || 0 > 1) {
    avatar = (
      <Avatar.Group
        maxCount={(props.max || 3) + 1}
        maxStyle={{
          color: '#FFFFFF',
          backgroundColor: `var(--grey-dark)`,
          width: props.size || 20,
          height: props.size || 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {users
          .filter((_, i) => i < (props.max || 3))
          .map(member => {
            channelName.push(UserService.getFullName(member));
            return (
              member && (
                <Avatar
                  key={member.id}
                  size={props.size || 20}
                  src={UserService.getThumbnail(member)}
                />
              )
            );
          })}
        {users.length > (props.max || 3) && (
          <Avatar
            size={props.size || 20}
            style={{ backgroundColor: 'var(--grey-dark)' }}
            icon={<DashOutlined />}
          />
        )}
      </Avatar.Group>
    );
  }

  return { avatar, name: channelName.join(', '), users };
};
