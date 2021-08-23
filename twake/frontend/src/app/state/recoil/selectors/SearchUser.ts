import { selectorFamily } from "recoil";
import { UserType } from "app/models/User";
import { UserListState } from "../atoms/UserList";

/**
 * Search users locally
 */
export const SearchUserSelector = selectorFamily<UserType[] | null, string>({
  key: "SearchUserSelector",
  get: (term) => async ({ get }) => {
    return get(UserListState).filter(user => `${user.username || ''} ${user.firstname || ''} ${user.lastname || ''} ${user.email || ''}`.includes(term));
  },
});
