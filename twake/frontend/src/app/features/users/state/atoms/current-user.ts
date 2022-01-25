import { atom } from 'recoil';
import { UserType } from 'app/features/users/types/user';
import Collections from 'app/services/Depreciated/Collections/Collections';
import _ from 'lodash';

export const CurrentUserState = atom<UserType | undefined>({
  key: 'CurrentUserState',
  default: undefined,
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet(user => Collections.get('users').updateObject(_.cloneDeep(user)));
    },
  ],
});
