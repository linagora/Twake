import { atomFamily } from 'recoil';

import UserAPIClient from 'app/services/user/UserAPIClient';
import { UserType } from 'app/models/User';
import Collections from 'app/services/Depreciated/Collections/Collections';

export const UsersState = atomFamily<UserType, string>({
  key: 'UsersState',
  default: async (id: string) => (await UserAPIClient.list([id]))?.[0],

  //Retro-compatibility
  effects_UNSTABLE: () => [
    ({ onSet }) => {
      onSet(user => Collections.get('users').updateObject(user));
    },
  ],
});
