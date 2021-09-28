// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Groups from 'services/workspaces/groups';
import Workspaces from 'services/workspaces/workspaces';
import Group from './Components/Group/Group';
import Workspace from './Components/Workspace/Workspace';
import useRouteState from 'app/services/hooks/useRouteState';

import './WorkspacesBar.scss';

export default () => {
  const { workspaceId, companyId } = useRouteState(({ workspaceId, companyId }) => ({ workspaceId, companyId }));

  Workspaces.useListener();
  Groups.useListener();
  Workspaces.initSelection();

  return (
    <Layout.Sider className={'workspaces_view'} width={70}>
      <PerfectScrollbar component="div" className="list">
        {Workspaces.getOrderedWorkspacesInGroup(companyId).map((item: WorkspaceType) => (
          <Workspace key={item.id} workspace={item} isSelected={workspaceId === item.id} />
        ))}
      </PerfectScrollbar>
      <Group/>
    </Layout.Sider>
  );
};
