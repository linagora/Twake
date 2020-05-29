import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import User from 'services/user/user.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import Groups from 'services/workspaces/groups.js';
import LocalStorage from 'services/localStorage.js';
import ChannelsService from 'services/channels/channels.js';
import workspacesUsers from './workspaces_users.js';
import Workspaces from './workspaces.js';
import WorkspacesUsers from './workspaces_users.js';
import CurrentUser from 'services/user/current_user.js';
import WindowService from 'services/utils/window.js';

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

  hasWorkspacePrivilege(privilege) {
    var rights = this.getUserRights();
    if ((rights.workspace || {}).admin) {
      return true;
    }
    return ((rights.workspace || {}).rights || []).indexOf(privilege) >= 0;
  }
}

const workspaces = new WorkspaceUserRights();
export default workspaces;
