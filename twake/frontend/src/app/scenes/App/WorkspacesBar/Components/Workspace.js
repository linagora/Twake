import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import ListenWorkspaces from 'services/workspaces/listen_workspace.js';
import Notifications from 'services/user/notifications.js';
import WorkspaceUI from 'components/Leftbar/Workspace/Workspace.js';

export default class Workspace extends Component {
  constructor() {
    super();

    this.state = {
      workspaces_repository: Collections.get('workspaces'),
    };
  }
  componentWillMount() {
    Collections.get('workspaces').addListener(this);
    ListenWorkspaces.listenWorkspace(this.props.workspace.id);
    Notifications.addListener(this);
  }
  componentWillUnmount() {
    ListenWorkspaces.cancelListenWorkspace(this.props.workspace.id);
    Collections.get('workspaces').removeListener(this);
    Notifications.removeListener(this);
  }
  render() {
    if (!this.props.workspace) {
      return '';
    }

    var workspace = Collections.get('workspaces').known_objects_by_id[this.props.workspace.id];
    if (!workspace) {
      return '';
    }

    Notifications.listenOnly(this, ['workspace_' + workspace.id]);

    return (
      <WorkspaceUI
        workspace={workspace}
        selected={this.props.isSelected}
        notifications={(Notifications.notification_by_workspace[workspace.id] || {}).count || 0}
        onClick={() => Workspaces.select(workspace)}
      />
    );
  }
}
