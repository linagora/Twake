import React, { useState } from 'react';

import { Layout } from 'antd';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Group from './Components/Group.js';
import Workspace from './Components/Workspace.js';
import PopupManager from 'services/popupManager/popupManager.js';
import CreateWorkspacePage from 'app/scenes/Client/Popup/CreateWorkspacePage/CreateWorkspacePage.js';
import WorkspaceAdd from 'components/Leftbar/Workspace/WorkspaceAdd.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import ElectronService from 'services/electron/electron.js';
import './WorkspacesBar.scss';

import PerfectScrollbar from 'react-perfect-scrollbar';
import RouterServices from 'services/RouterServices';
import { useParams } from 'react-router-dom';

export default function WorkspacesBar() {
  const { workspaceId } = useParams() as any;

  Workspaces.useListener(useState);
  Groups.useListener(useState);
  WorkspaceUserRights.useListener(useState);

  Workspaces.updateCurrentWorkspaceId();

  return (
    <Layout.Sider
      className="workspaces_view fade_in"
      width={ElectronService.isElectron() ? '70px' : '60px'}
    >
      <PerfectScrollbar component="div" className="list">
        {Workspaces.getOrderedWorkspacesInGroup(Groups.currentGroupId, false).map((item: any) => (
          <Workspace
            key={item.id}
            workspace={item}
            isSelected={RouterServices.translateToUUID(workspaceId) === item.id}
          />
        ))}
        {!!WorkspaceUserRights.hasWorkspacePrivilege() && (
          <WorkspaceAdd onClick={() => PopupManager.open(<CreateWorkspacePage />)} />
        )}
      </PerfectScrollbar>

      <Group group={{ id: Groups.currentGroupId }} />
    </Layout.Sider>
  );
  //}
}
