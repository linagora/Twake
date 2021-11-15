// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import WorkspacesService from 'services/workspaces/workspaces';
import WorkspaceIcon from './WorkspaceIcon';
import { WorkspaceType } from 'app/models/Workspace';

import './Workspace.scss';
import useRouterWorkspace from 'app/services/hooks/useRouterWorkspace';

type Props = {
  workspace: WorkspaceType;
  
};

export default ({workspace}: Props): JSX.Element => {
  const routerWorkspace = useRouterWorkspace();
 
  return (
    <WorkspaceIcon
      workspace={workspace}
      selected={routerWorkspace === workspace.id}
      onClick={() => WorkspacesService.select(workspace)}
    />
  );
};
