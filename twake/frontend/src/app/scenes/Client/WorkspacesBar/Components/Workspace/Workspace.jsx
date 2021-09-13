// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';

import Collections from 'app/services/Depreciated/Collections/Collections';
import WorkspacesService from 'services/workspaces/workspaces';
import ListenWorkspaces from 'services/workspaces/listen_workspace';
import WorkspaceIcon from './WorkspaceIcon';

import './Workspace.scss';

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

    const workspace = Collections.get('workspaces').known_objects_by_id[this.props.workspace.id];
    if (!workspace) {
      return '';
    }

    return (
      <WorkspaceIcon
        workspace={workspace}
        selected={this.props.isSelected}
        onClick={() => WorkspacesService.select(workspace)}
      />
    );
  }
}
