import { selector } from 'recoil';
import { UserListState } from 'app/features/users/state/atoms/user-list';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import { UserType } from 'app/features/users/types/user';

export const CurrentUserSelector = selector<UserType | undefined>({
  key: 'CurrentUserSelector',
  get: ({ get }) => get(UserListState).find(user => user.id === CurrentUser.get()),
});
