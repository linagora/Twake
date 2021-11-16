import { atom, DefaultValue, selector, selectorFamily } from "recoil";

import { UserType } from "app/models/User";
import { CurrentUserState } from "./CurrentUser";

export type OnlineUserType = Pick<UserType, "id" | "connected"> & {
  lastSeen: number;
  initialized: boolean;
};

const CurrentUserStatus = selector<OnlineUserType[]>({
  key: 'CurrentUserStatus',
  get: ({ get }) => {
    const currentUser = get(CurrentUserState);

    return currentUser ? [{id: currentUser.id!, connected: true, lastSeen: Date.now(), initialized: true, }]: [];
  }
});

export const OnlineUsersState = atom<OnlineUserType[]>({
  key: 'OnlineUsersState',
  default: CurrentUserStatus,
});

export const CountOnlineUsers = selector<number>({
  key: 'CountOnlineUsers',
  get: ({ get }) => get(OnlineUsersState).filter(u => u.connected).length,
});

export const OnlineUserStateFamily = selectorFamily<OnlineUserType, string>({
  key: 'OnlineUserState',
  get: (userId) => ({ get }) => {
    return get(OnlineUsersState).find(u => u.id === userId) || { id: userId, connected: false, lastSeen: Date.now(), initialized: false };
  },
  set: (userId) => ({ set }, newValue) => {
    if (!(newValue instanceof DefaultValue)) {
      const newStatus: OnlineUserType = { ...newValue as unknown as OnlineUserType, ...{ id: userId }};

      set(OnlineUsersState, previousStatus => {
        const index = previousStatus.findIndex(e => e.id === userId);

        return index === -1 ?
          [...previousStatus, newStatus]
          :
          [...previousStatus.slice(0, index), newStatus, ...previousStatus.slice(index + 1)];
      });
    }
  },
});
