import React, { useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import { WorkspaceType } from 'app/features/workspaces/types/workspace';
import Workspace from './components/Workspace/Workspace';
import { useWorkspaces } from 'app/features/workspaces/hooks/use-workspaces';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { LoadingWorkspaceIcon } from './components/Workspace/WorkspaceIcon';
import CompanySelector from './components/CompanySelector';

import './styles.scss';

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
    companyId && refresh();
  }, [companyId]);

  return (
    <PerfectScrollbar component="div" className="list" options={{ suppressScrollX: true }}>
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
