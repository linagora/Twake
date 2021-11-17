import { atom } from 'recoil';

import { ClientStateType } from 'app/services/RouterService';

export const RouterState = atom<ClientStateType | undefined>({
  key: 'RouterState',
  default: undefined,
});
