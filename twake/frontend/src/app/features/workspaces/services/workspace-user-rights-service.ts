import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import AccessRightsService, { RightsOrNone } from 'services/AccessRightsService';

class WorkspaceUserRights {
  isNotConnected(): boolean {
    return AccessRightsService.getLevel(Workspaces.currentWorkspaceId) === 'none';
  }

  isInvite(userId = false): boolean {
    if (!userId) {
      return (
        !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member') ||
        AccessRightsService.getCompanyLevel(Workspaces.currentGroupId) === 'guest'
      );
    }
    return true;
  }

  isGroupInvite(): boolean {
    return AccessRightsService.getCompanyLevel(Workspaces.currentGroupId) === 'guest';
  }

  hasGroupPrivilege(): boolean {
    return AccessRightsService.hasCompanyLevel(Workspaces.currentGroupId, 'admin');
  }

  hasWorkspacePrivilege(level: RightsOrNone = 'moderator'): boolean {
    return AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, level);
  }
}

export default new WorkspaceUserRights();
