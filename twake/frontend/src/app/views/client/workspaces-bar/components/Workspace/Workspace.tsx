// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import WorkspacesService from 'services/workspaces/workspaces';
import WorkspaceIcon from './WorkspaceIcon';
import { WorkspaceType } from 'app/models/Workspace';
import useRouterWorkspaceSelected from 'app/state/recoil/hooks/router/useRouterWorkspaceSelected';

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
