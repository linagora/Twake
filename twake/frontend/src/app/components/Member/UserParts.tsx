import React from 'react';
import { Avatar, Badge, Tag } from 'antd';
import { DashOutlined } from '@ant-design/icons';
import { User } from 'react-feather';
import Languages from 'services/languages/languages';
import RouterServices from 'services/RouterService';
import { UserType } from 'app/models/User';
import UserService from 'services/user/UserService';
import Collections from 'services/Depreciated/Collections/Collections';
import UsersService from 'services/user/UserService';

type UserPartsType = {
  avatar: JSX.Element;
  name: string;
  users: UserType[];
  companyRole: JSX.Element;
};

type PropsType = {
  usersIds: string[];
  keepMyself?: boolean;
  max?: number;
  size?: number;
};

export const getUserParts = (props: PropsType): UserPartsType => {
  const { companyId } = RouterServices.getStateFromRoute();

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

  channelMembers?.map(userId => users.push(Collections.get('users').find(userId)));

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

  const roleOriginalString = UserService.getUserRole(users[0], companyId);
  const companyRoleObject = getCurrentCompanyRoleObject(roleOriginalString);
  const companyRole =
    companyRoleObject.name !== 'unknown' ? (
      <Tag color={companyRoleObject.color}>{companyRoleObject.name}</Tag>
    ) : (
      <></>
    );
  return {
    avatar,
    name: channelName.join(', '),
    users,
    companyRole,
  };
};

const getCurrentCompanyRoleObject = (role: string) => {
  switch (role) {
    case 'admin':
      return {
        color: 'var(--red)',
        name: Languages.t('general.user.role.company.admin'),
      };
    case 'member':
      return {
        color: 'var(--primary)',
        name: Languages.t('general.user.role.company.member'),
      };
    case 'guest':
      return {
        color: 'var(--grey-dark)',
        name: Languages.t('general.user.role.company.guest'),
      };
    default:
      return { name: 'unknown' };
  }
};
