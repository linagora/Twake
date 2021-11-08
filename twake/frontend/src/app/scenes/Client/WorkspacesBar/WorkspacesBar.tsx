// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Group from './Components/Group/Group';
import Workspace from './Components/Workspace/Workspace';
import { useCompanyWorkspaces } from 'app/state/recoil/hooks/useCompanyWorkspaces';

import './WorkspacesBar.scss';
import useRouterCompany from 'app/services/hooks/useRouterCompany';
import useRouterWorkspace from 'app/services/hooks/useRouterWorkspace';

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [workspaces] = useCompanyWorkspaces(companyId);

  return (
    <Layout.Sider className={'workspaces_view'} width={70}>
      <PerfectScrollbar component="div" className="list">
        {workspaces.map((ws: WorkspaceType) => (
           
          <Workspace key={ws.id} workspace={ws} isSelected={workspaceId === ws.id} />
          
        ))}
      </PerfectScrollbar>
      <Group/>
    </Layout.Sider>
  );
};

