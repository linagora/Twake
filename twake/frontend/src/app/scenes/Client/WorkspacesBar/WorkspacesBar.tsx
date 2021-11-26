// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Workspace from './Components/Workspace/Workspace';
import { useCompanyWorkspaces } from 'app/state/recoil/hooks/useCompanyWorkspaces';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import { LoadingWorkspaceIcon } from './Components/Workspace/WorkspaceIcon';
import LocalStorage from 'app/services/LocalStorage';
import CompanySelector from './Components/CompanySelector';
import UserService from 'app/services/user/UserService';

import './WorkspacesBar.scss';

const WorkspaceListComponent = ({ companyId }: { companyId: string }) => {
  const [workspaces] = useCompanyWorkspaces(companyId);
  return (
    <PerfectScrollbar component="div" className="list">
      {workspaces.map((ws: WorkspaceType) => (
        <Workspace key={ws.id} workspace={ws} />
      ))}
    </PerfectScrollbar>
  );
};

export default () => {
  const companyId = useRouterCompany() || (LocalStorage.getItem('default_company_id') as string);
  const currentUserId = UserService.getCurrentUserId();

  return (
    <Layout.Sider className="workspaces_view" width={70}>
      {companyId && companyId.length > 0 ? <WorkspaceListComponent companyId={companyId} /> : <></>}
      {currentUserId ? <CompanySelector userId={currentUserId} /> : <></>}{' '}
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
