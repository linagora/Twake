// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense } from 'react';
import classNames from 'classnames';

import { UserType } from 'app/features/users/types/user';
import { useOnlineUser } from 'app/features/users/hooks/use-online-user';

import './online-user-status.scss';

type PropsType = {
  user: UserType;
  size?: 'small' | 'medium' | 'big';
};

const WrappedUserStatus = ({ user, size = 'medium' }: PropsType): JSX.Element => {
  const userOnlineStatus = useOnlineUser(user.id as string);
  const online =
    (userOnlineStatus && userOnlineStatus.connected) ||
    (user.last_seen || userOnlineStatus.lastSeen || 0) > Date.now() - 10 * 60 * 1000;

  return (
    <div
      className={classNames('online_user_status ' + user.last_seen + ' ', {
        online: !!online,
        offline: !online,
        small: size === 'small',
        medium: size === 'medium',
        big: size === 'big',
      })}
    />
  );
};

const UserOnlineStatus = (props: PropsType): JSX.Element => {
  return (
    <Suspense fallback={<></>}>
      <WrappedUserStatus {...props} />
    </Suspense>
  );
};

export default UserOnlineStatus;
