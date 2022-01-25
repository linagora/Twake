// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import WorkspacesService from 'app/deprecated/workspaces/workspaces';
import WorkspaceIcon from './WorkspaceIcon';
import { WorkspaceType } from 'app/features/workspaces/types/workspace';
import useRouterWorkspaceSelected from 'app/features/router/hooks/use-router-workspace-selected';

import './Workspace.scss';

type Props = {
  workspace: WorkspaceType;
};

export default ({ workspace }: Props): JSX.Element => {
  return (
    <WorkspaceIcon
      workspace={workspace}
      selected={useRouterWorkspaceSelected(workspace.id)}
      onClick={() => WorkspacesService.select(workspace)}
    />
  );
};
