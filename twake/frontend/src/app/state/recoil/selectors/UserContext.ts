import { selector } from "recoil";

import { UserContext } from "app/models/UserContext";
import { CurrentCompanyState } from "../atoms/CurrentCompany";
import { CurrentUserState } from "../atoms/CurrentUser";
import { CurrentWorkspaceState } from "../atoms/CurrentWorkspace";

/**
 * User context contains current company/workspace/user
 */
export const UserContextSelector = selector<UserContext | undefined>({
  key: "UserContextSelector",
  get: (({ get }) => ({
    company: get(CurrentCompanyState),
    workspace: get(CurrentWorkspaceState),
    user: get(CurrentUserState),
  })),
});
