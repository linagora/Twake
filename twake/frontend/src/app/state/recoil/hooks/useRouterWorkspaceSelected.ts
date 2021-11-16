import { RouterWorkspaceSelectedSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue } from 'recoil';

export default function useRouterWorkspaceSelected(workspaceId: string) {
  return useRecoilValue(RouterWorkspaceSelectedSelector(workspaceId));
}
