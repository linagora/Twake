import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Group from './Components/Group/Group';
import Workspace from './Components/Workspace/Workspace';
import { useCompanyWorkspaces } from 'app/state/recoil/hooks/useCompanyWorkspaces';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import { LoadingWorkspaceIcon } from './Components/Workspace/WorkspaceIcon';

import './WorkspacesBar.scss';

export default () => {
  const companyId = useRouterCompany();
  const [workspaces] = useCompanyWorkspaces(companyId);

  return (
    <Layout.Sider className={'workspaces_view'} width={70}>
      <PerfectScrollbar component="div" className="list">
        {workspaces.map((ws: WorkspaceType) => (
          <Workspace key={ws.id} workspace={ws} />
        ))}
      </PerfectScrollbar>
      <Group />
    </Layout.Sider>
  );
};

export const LoadingWorkspaceBar = () => {
  return (
    <Layout.Sider className={'workpaces_view_loading'} width={70}>
      <div className="list">
        <LoadingWorkspaceIcon />
        <LoadingWorkspaceIcon />
      </div>
      <Skeleton.Avatar size={32} shape={'square'} style={{ marginBottom: 4 }} />
    </Layout.Sider>
  );
};
