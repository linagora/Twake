import { CompanyType } from "./Company";
import { UserType } from "./User";
import { WorkspaceType } from "./Workspace";

export type UserContext = {
  company?: CompanyType;
  workspace?: WorkspaceType;
  user?: UserType;
};
