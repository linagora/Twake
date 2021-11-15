import { atom, selector } from 'recoil';

import { ClientStateType } from 'app/services/RouterService';

export const RouterState = atom<ClientStateType | undefined>({
  key: 'RouterState',
  default: undefined,
});

// to be moved in ./selector
export const RouterCompanySelector = selector<string>({
  key: 'RouterCompanySelector',
  get: ({ get }) => get(RouterState)?.companyId || '',
});

export const RouterWorkspaceSelector = selector<string>({
  key: 'RouterWorkspaceSelector',
  get: ({ get }) => get(RouterState)?.workspaceId || '',
});

export const RouterChannelSelector = selector<string>({
  key: 'RouterChannelSelector',
  get: ({ get }) => get(RouterState)?.channelId || '',
});
