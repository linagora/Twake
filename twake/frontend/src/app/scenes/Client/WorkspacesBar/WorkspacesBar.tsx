import React from 'react';

import { Layout } from 'antd';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Group from './Components/Group.js';
import Workspace from './Components/Workspace.js';
import ElectronService from 'services/electron/electron.js';
import './WorkspacesBar.scss';

import PerfectScrollbar from 'react-perfect-scrollbar';
import RouterServices from 'services/RouterServices';

export default () => {
  const { companyId, workspaceId } = RouterServices.useStateFromRoute();

  Workspaces.useListener();
  Groups.useListener();

  Workspaces.initSelection();

  return (
    <Layout.Sider
      className={'workspaces_view'}
      width={ElectronService.isElectron() ? '70px' : '60px'}
    >
      <PerfectScrollbar component="div" className="list">
        {Workspaces.getOrderedWorkspacesInGroup(companyId).map((item: any) => (
          <Workspace key={item.id} workspace={item} isSelected={workspaceId === item.id} />
        ))}
      </PerfectScrollbar>

      <Group selected={companyId} />
    </Layout.Sider>
  );
};
