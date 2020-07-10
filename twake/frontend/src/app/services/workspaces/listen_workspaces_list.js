import React from 'react';
import ws from 'services/websocket.js';
import Workspaces from 'services/workspaces/workspaces.js';
import User from 'services/user/user.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';

class ListenWorkspacesList {
  constructor() {}

  startListen() {
<<<<<<< HEAD
    ws.subscribe('workspaces_of_user/' + User.getCurrentUserId(), function (uri, data) {
=======
    ws.subscribe('workspaces_of_user/' + User.getCurrentUserId(), function(uri, data) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      console.log('recieve from ' + uri, data);
      if (data.workspace) {
        if (data.type == 'remove') {
          Workspaces.removeFromUser(data.workspace);
          Workspaces.notify();
        } else if (data.type == 'add') {
          Workspaces.addToUser(data.workspace);
          Workspaces.notify();
        }
      }
      if (data.type == 'update_group_privileges') {
        WorkspaceUserRights.currentUserRightsByGroup[data.group_id] = data.privileges;
        WorkspaceUserRights.notify();
      }
      if (data.type == 'update_workspace_level') {
        WorkspaceUserRights.currentUserRightsByWorkspace[data.workspace_id] = data.level;
        WorkspaceUserRights.notify();
      }
    });
  }

  cancelListen() {
    ws.unsubscribe('workspaces_of_user/' + User.getCurrentUserId());
  }
}

const service = new ListenWorkspacesList();
export default service;
