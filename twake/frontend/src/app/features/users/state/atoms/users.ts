import { atomFamily } from 'recoil';

import UserAPIClient from 'app/features/users/api/user-api-client';
import { UserType } from 'app/features/users/types/user';
import Collections from 'app/services/Depreciated/Collections/Collections';
import _ from 'lodash';

export const UsersState = atomFamily<UserType, string>({
  key: 'UsersState',
  default: async (id: string) => (await UserAPIClient.list([id]))?.[0],

  //Retro-compatibility
  effects_UNSTABLE: () => [
    ({ onSet }) => {
      onSet(user => Collections.get('users').updateObject(_.cloneDeep(user)));
    },
  ],
});
