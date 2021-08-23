import { atom, AtomEffect } from "recoil";

import { UserType } from "app/models/User";
import UserContextState from "../../UserContextState";

const currentUserEffect: AtomEffect<UserType | undefined> = ({ onSet }) => {
  onSet(user => UserContextState.user = user);
};

export const CurrentUserState = atom<UserType | undefined>({
  key: 'CurrentUserState',
  default: undefined,
  effects_UNSTABLE: [
    currentUserEffect,
  ]
});
