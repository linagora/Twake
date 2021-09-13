import Observable from 'app/services/Depreciated/observable.js';
import Workspaces from 'services/workspaces/workspaces.js';
import AccessRightsService, { RightsOrNone } from 'services/AccessRightsService';

class WorkspaceUserRights extends Observable {
  currentUserRightsByWorkspace: { [key: string]: RightsOrNone };
  currentUserRightsByGroup: { [key: string]: RightsOrNone };

  constructor() {
    super();
    this.setObservableName('workspace_user_rights');

    this.currentUserRightsByGroup = {};
    this.currentUserRightsByWorkspace = {};
  }

  getUserRights(): { workspace: RightsOrNone; group: RightsOrNone } {
    return {
      workspace: this.currentUserRightsByWorkspace[Workspaces.currentWorkspaceId] || [],
      group: this.currentUserRightsByGroup[Workspaces.currentGroupId] || [],
    };
  }

  isNotConnected(): boolean {
    return AccessRightsService.getLevel(Workspaces.currentWorkspaceId) === 'none';
  }

  isInvite(userId = false): boolean {
    if (!userId) {
      return !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member');
    }
    return true;
  }

  isGroupInvite(): boolean {
    return !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member');
  }

  hasGroupPrivilege(): boolean {
    return AccessRightsService.hasCompanyLevel(Workspaces.currentGroupId, 'admin');
  }

  hasWorkspacePrivilege(level: RightsOrNone = 'moderator'): boolean {
    return AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, level);
  }
}

export default new WorkspaceUserRights();
