// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import WorkspacesService from 'services/workspaces/workspaces';
import WorkspaceIcon from './WorkspaceIcon';
import { WorkspaceType } from 'app/models/Workspace';

import './Workspace.scss';

type Props = {
  workspace: WorkspaceType;
  isSelected: boolean;
};

export default ({ workspace, isSelected = false }: Props): JSX.Element => {
  return (
    <WorkspaceIcon
      workspace={workspace}
      selected={isSelected}
      onClick={() => WorkspacesService.select(workspace)}
    />
  );
};
