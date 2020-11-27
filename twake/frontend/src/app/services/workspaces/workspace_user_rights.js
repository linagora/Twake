import React from 'react';
import Observable from 'app/services/Depreciated/observable.js';
import WorkspacesUsers from './workspaces_users.js';
import Workspaces from './workspaces.js';
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
    return (
      !this.currentUserRightsByWorkspace[Workspaces.currentWorkspaceId] ||
      ['drive_public_access'].indexOf(WindowService.findGetParameter('view')) >= 0
    );
  }

  isInvite(userId = false) {
    var user = userId || CurrentUser.get().id;
    return ((WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {})[user] || {})
      .externe;
  }

  isInviteChannelOnly(userId = false) {
    var user = userId || CurrentUser.get().id;
    return (
      this.isInvite() &&
      !((WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {})[user] || {})
        .autoAddExterne
    );
  }

  isGroupInvite() {
    return (
      (WorkspacesUsers.users_by_group[Workspaces.currentGroupId] || {})[CurrentUser.get().id] || {}
    ).externe;
  }

  hasGroupPrivilege(privilege) {
    var rights = this.getUserRights();
    return (rights.group || []).indexOf(privilege) >= 0;
  }

  hasWorkspacePrivilege(level = 'administrator') {
    return AccessRightsService.hasRight(Workspaces.currentWorkspaceId, level);
  }
}

const workspaces = new WorkspaceUserRights();
export default workspaces;
