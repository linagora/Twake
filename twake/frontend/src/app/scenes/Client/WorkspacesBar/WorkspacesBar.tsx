import React, { useState, useEffect } from 'react';

import Languages from 'services/languages/languages.js';
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

export default () => {
  const { companyId, workspaceId } = RouterServices.useStateFromRoute();

  Workspaces.useListener();
  Groups.useListener();
  WorkspaceUserRights.useListener();

  Workspaces.initSelection();

  return (
    <Layout.Sider
      className={'workspaces_view'}
      width={ElectronService.isElectron() ? '70px' : '60px'}
    >
      <PerfectScrollbar component="div" className="list">
        {Workspaces.getOrderedWorkspacesInGroup(companyId, false).map((item: any) => (
          <Workspace key={item.id} workspace={item} isSelected={workspaceId === item.id} />
        ))}
        {!!WorkspaceUserRights.hasGroupPrivilege('MANAGE_DATA') && (
          <WorkspaceAdd onClick={() => PopupManager.open(<CreateWorkspacePage />)} />
        )}
      </PerfectScrollbar>

      <Group selected={companyId} />
    </Layout.Sider>
  );
};
