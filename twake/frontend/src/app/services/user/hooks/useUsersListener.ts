import { useState, useEffect } from 'react';
import { isArray } from 'lodash';
import UserListenerService from 'app/services/user/ListenUsers';
import Collections from 'services/Depreciated/Collections/Collections';
import UsersService from 'services/user/UserService';
import userAsyncGet from 'services/user/AsyncGet';

export const useUsersListener = (usersIds: string[] = []) => {
  const users = (isArray(usersIds) ? usersIds : []).filter(
    e => (usersIds.length || 0) === 1 || e !== UsersService.getCurrentUserId(),
  );
  Collections.get('users').useListener(useState, users);

  useEffect(() => {
    users.forEach(userId => {
      UserListenerService.listenUser(userId);
      userAsyncGet(userId);
    });

    return () => {
      users.forEach(userId => UserListenerService.cancelListenUser(userId));
    };
  }, [users]);

  return users;
};
