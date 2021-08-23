import { atom } from "recoil";
import { UserType } from "app/models/User";

export const UserListState = atom<UserType[]>({
  key: 'UserListState',
  default: [],
});
