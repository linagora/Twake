import { CompanyType } from '../../companies/types/company';
import { PendingFileRecoilType } from '../../files/types/file';

import { UserType } from 'app/features/users/types/user';
import { WorkspaceType } from '../../../models/Workspace';

export type UserContext = {
  company?: CompanyType;
  workspace?: WorkspaceType;
  user?: UserType;
  pending_files_list?: PendingFileRecoilType[];
};
