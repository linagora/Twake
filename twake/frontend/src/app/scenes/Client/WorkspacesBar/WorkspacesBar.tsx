// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';

import { WorkspaceType } from 'app/models/Workspace';
import Group from './Components/Group/Group';
import Workspace from './Components/Workspace/Workspace';
import useRouteState from 'app/services/hooks/useRouteState';
import { useCompanyWorkspaces } from 'app/state/recoil/hooks/useCompanyWorkspaces';

import './WorkspacesBar.scss';

export default () => {
  const { workspaceId, companyId } = useRouteState(({ workspaceId, companyId }) => ({
    workspaceId,
    companyId,
  }));
  const [workspaces] = useCompanyWorkspaces(companyId);

  return (
    <>
      {' '}
      <PerfectScrollbar component="div" className="list">
        {workspaces.map((ws: WorkspaceType) => (
          <Workspace key={ws.id} workspace={ws} isSelected={workspaceId === ws.id} />
        ))}
      </PerfectScrollbar>
      <Group />
    </>
  );
};
