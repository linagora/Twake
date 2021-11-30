import { SetterOrUpdater, useRecoilState } from 'recoil';

import { WorkspaceType } from 'app/models/Workspace';
import { CurrentWorkspaceState } from '../atoms/CurrentWorkspace';

export function useCurrentWorkspace(): [
  WorkspaceType | undefined,
  SetterOrUpdater<WorkspaceType | undefined>,
] {
  const [currentWorkspace, setCurrentWorkspace] = useRecoilState(CurrentWorkspaceState);

  return [currentWorkspace, setCurrentWorkspace];
}
