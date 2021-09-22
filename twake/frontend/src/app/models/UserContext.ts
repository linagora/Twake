import { CompanyType } from './Company';
import { PendingFileStateType } from './File';
import { UserType } from './User';
import { WorkspaceType } from './Workspace';

export type UserContext = {
  company?: CompanyType;
  workspace?: WorkspaceType;
  user?: UserType;
  pending_files_list?: PendingFileStateType[];
};
