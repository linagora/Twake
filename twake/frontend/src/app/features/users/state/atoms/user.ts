import { atomFamily, RecoilState, useRecoilCallback } from 'recoil';

import UserAPIClient from 'app/features/users/api/user-api-client';
import { UserType } from 'app/features/users/types/user';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections';
import _ from 'lodash';

export const UserState = atomFamily<UserType | undefined, string>({
  key: 'UserState',
  default: undefined,

  //Retro-compatibility
  effects_UNSTABLE: () => [
    ({ onSet }) => {
      onSet(user => Collections.get('users').updateObject(_.cloneDeep(user)));
    },
  ],
});
