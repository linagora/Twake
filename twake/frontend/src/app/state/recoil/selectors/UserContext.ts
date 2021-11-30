import { selector } from 'recoil';

import { UserContext } from 'app/models/UserContext';
import { CurrentUserState } from '../atoms/CurrentUser';
import { CurrentWorkspaceState } from '../atoms/CurrentWorkspace';

/**
 * User context contains current company/workspace/user
 */
export const UserContextSelector = selector<UserContext | undefined>({
  key: 'UserContextSelector',
  get: ({ get }) => ({
    workspace: get(CurrentWorkspaceState),
    user: get(CurrentUserState),
  }),
});
