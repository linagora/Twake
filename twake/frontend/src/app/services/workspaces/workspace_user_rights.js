import React from 'react';
import Observable from 'app/services/Depreciated/observable.js';
import WorkspacesUsers from './workspaces_users.js';
import Workspaces from 'services/workspaces/workspaces.js';
import CurrentUser from 'services/user/current_user.js';
import WindowService from 'services/utils/window.js';
import AccessRightsService from 'services/AccessRightsService';

import Globals from 'services/Globals.js';

class WorkspaceUserRights extends Observable {
  constructor() {
    super();
    this.setObservableName('workspace_user_rights');

    this.currentUserRightsByGroup = {};
    this.currentUserRightsByWorkspace = {};

    Globals.window.workspaceUserRights = this;
  }

  getUserRights() {
    return {
      workspace: this.currentUserRightsByWorkspace[Workspaces.currentWorkspaceId] || [],
      group: this.currentUserRightsByGroup[Workspaces.currentGroupId] || [],
    };
  }

  isNotConnected() {
    return AccessRightsService.getLevel(Workspaces.currentWorkspaceId) === 'none';
  }

  isInvite(userId = false) {
    if (!userId) {
      return !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member');
    }
    return true;
  }

  isGroupInvite() {
    return !AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'member');
  }

  hasGroupPrivilege(privilege) {
    return AccessRightsService.hasCompanyLevel(Workspaces.currentGroupId, 'administrator');
  }

  hasWorkspacePrivilege(level = 'administrator') {
    return AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, level);
  }
}

const workspaces = new WorkspaceUserRights();
export default workspaces;
