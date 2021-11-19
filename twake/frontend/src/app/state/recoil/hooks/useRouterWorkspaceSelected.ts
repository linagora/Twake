import { useRecoilValue } from 'recoil';
import { RouterWorkspaceSelectedSelector } from '../selectors/RouterSelector';

export default function useRouterWorkspaceSelected(workspaceId: string) {
  return useRecoilValue(RouterWorkspaceSelectedSelector(workspaceId));
}
