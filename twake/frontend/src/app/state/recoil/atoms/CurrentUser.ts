import { atom } from 'recoil';
import { UserType } from 'app/models/User';

export const CurrentUserState = atom<UserType | undefined>({
  key: 'CurrentUserState',
  default: undefined,
});
