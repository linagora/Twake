import { CompanyType } from 'app/models/Company';
import { PendingFileType } from 'app/models/File';
import { UserType } from 'app/models/User';
import { UserContext } from 'app/models/UserContext';
import { WorkspaceType } from 'app/models/Workspace';

/**
 * This is a temporary state maintained by recoil atom effects until all the code base is moved to hooks and recoil
 * Note that these objects are not reactive and will not cause rendering. They are just here for read access.
 */
class UserContextState implements UserContext {
  private _user: UserType | undefined;
  private _company: CompanyType | undefined;
  private _workspace: WorkspaceType | undefined;
  private _pending_files_list: PendingFileType[] | undefined;

  set user(user: UserType | undefined) {
    user && (this._user = { ...user });
  }

  get user() {
    return this._user as UserType;
  }

  set company(company: CompanyType | undefined) {
    company && (this._company = { ...company });
  }

  get company() {
    return this.company as CompanyType;
  }

  set workspace(workspace: WorkspaceType | undefined) {
    workspace && (this._workspace = { ...workspace });
  }

  get workspace() {
    return this._workspace as WorkspaceType;
  }

  set pending_files_list(pendingFilesList: PendingFileType[] | undefined) {
    pendingFilesList && (this._pending_files_list = pendingFilesList);
  }

  get pending_files_list() {
    return this._pending_files_list as PendingFileType[];
  }
}

export default new UserContextState();
