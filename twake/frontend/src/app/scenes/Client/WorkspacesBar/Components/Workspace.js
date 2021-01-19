import React, { Component } from 'react';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import ListenWorkspaces from 'services/workspaces/listen_workspace.js';
import WorkspaceUI from 'app/scenes/Client/WorkspacesBar/Components/Workspace/Workspace';

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
  }
  componentWillUnmount() {
    ListenWorkspaces.cancelListenWorkspace(this.props.workspace.id);
    Collections.get('workspaces').removeListener(this);
  }
  render() {
    if (!this.props.workspace) {
      return '';
    }

    var workspace = Collections.get('workspaces').known_objects_by_id[this.props.workspace.id];
    if (!workspace) {
      return '';
    }

    return (
      <WorkspaceUI
        workspace={workspace}
        selected={this.props.isSelected}
        onClick={() => Workspaces.select(workspace)}
      />
    );
  }
}
