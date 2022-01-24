// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense } from 'react';
import classNames from 'classnames';

import { UserType } from 'app/models/User';
import { useOnlineUser } from 'app/services/OnlineUser/useOnlineUser';

import './online-user-status.scss';

type PropsType = {
  user: UserType;
  size?: 'small' | 'medium' | 'big'
};

const WrappedUserStatus = ({ user, size = 'medium' }: PropsType): JSX.Element => {
  const userOnlineStatus = useOnlineUser(user.id!);

  return (
    <div
      className={
        classNames(
          'online_user_status',
          {
            online: userOnlineStatus && userOnlineStatus.connected,
            offline: userOnlineStatus && !userOnlineStatus.connected,
            small: size === 'small',
            medium: size === 'medium',
            big: size === 'big',
          },
        )
      }
    />
  );
};

const UserOnlineStatus = (props: PropsType): JSX.Element => {
  return (
    <Suspense fallback={<></>}>
      <WrappedUserStatus {...props}/>
    </Suspense>
  );
};

export default UserOnlineStatus;
