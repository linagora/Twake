import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Group from './Components/Group.js';
import Workspace from './Components/Workspace.js';
import PopupManager from 'services/popupManager/popupManager.js';
import CreateWorkspacePage from 'scenes/App/Popup/CreateWorkspacePage/CreateWorkspacePage.js';
import WorkspaceAdd from 'components/Leftbar/Workspace/WorkspaceAdd.js';
import './WorkspacesBar.scss';

import PerfectScrollbar from 'react-perfect-scrollbar';

export default class WorkspacesBar extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspaces: Workspaces,
      group: Groups,
    };

    Languages.addListener(this);
    Workspaces.addListener(this);
    Groups.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Workspaces.removeListener(this);
    Groups.removeListener(this);
  }
  render() {
    if (Workspaces.getOrderedWorkspacesInGroup(Groups.currentGroupId).length == 0) {
      Workspaces.initSelection();
    }

    return (
      <div className="workspaces_view fade_in">
        <PerfectScrollbar component="div" className="list">
          {Workspaces.getOrderedWorkspacesInGroup(Groups.currentGroupId).map(item => (
            <Workspace
              key={item.id}
              workspace={item}
              isSelected={Workspaces.currentWorkspaceId == item.id}
            />
          ))}

          <WorkspaceAdd onClick={() => PopupManager.open(<CreateWorkspacePage />)} />
        </PerfectScrollbar>

        <Group group={{ id: Groups.currentGroupId }} />
      </div>
    );
  }
}
