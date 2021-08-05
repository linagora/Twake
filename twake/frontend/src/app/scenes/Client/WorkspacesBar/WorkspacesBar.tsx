// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';

import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Group from './Components/Group.js';
import Workspace from './Components/Workspace.js';
import RouterServices from 'app/services/RouterService';

import './WorkspacesBar.scss';

export default () => {
  const { companyId, workspaceId } = RouterServices.useRouteState();

  Workspaces.useListener();
  Groups.useListener();
  Workspaces.initSelection();

  return (
    <Layout.Sider className={'workspaces_view'} width={70}>
      <PerfectScrollbar component="div" className="list">
        {Workspaces.getOrderedWorkspacesInGroup(companyId).map((item: any) => (
          <Workspace key={item.id} workspace={item} isSelected={workspaceId === item.id} />
        ))}
      </PerfectScrollbar>

      <Group selected={companyId} />
    </Layout.Sider>
  );
};
