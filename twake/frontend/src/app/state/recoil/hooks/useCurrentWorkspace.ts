import { useRecoilState } from 'recoil';

import { CurrentWorkspaceState } from '../atoms/CurrentWorkspace';

export function useCurrentWorkspace() {
  const [currentWorkspace, setCurrentWorkspace] = useRecoilState(CurrentWorkspaceState);

  return currentWorkspace;
}
