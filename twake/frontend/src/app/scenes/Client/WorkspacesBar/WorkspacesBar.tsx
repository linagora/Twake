import React, { useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Workspace from './Components/Workspace/Workspace';
import { useWorkspaces } from 'app/state/recoil/hooks/useWorkspaces';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import { LoadingWorkspaceIcon } from './Components/Workspace/WorkspaceIcon';
import CompanySelector from './Components/CompanySelector';

import './WorkspacesBar.scss';

export default () => {
  const companyId = useRouterCompany();

  return (
    <Layout.Sider className="workspaces_view" width={70}>
      {companyId && <WorkspaceListComponent companyId={companyId} />}
      <CompanySelector />
    </Layout.Sider>
  );
};

const WorkspaceListComponent = ({ companyId }: { companyId: string }) => {
  const { workspaces, refresh } = useWorkspaces(companyId);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PerfectScrollbar component="div" className="list">
      {workspaces.map((ws: WorkspaceType) => (
        <Workspace key={ws.id} workspace={ws} />
      ))}
    </PerfectScrollbar>
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
