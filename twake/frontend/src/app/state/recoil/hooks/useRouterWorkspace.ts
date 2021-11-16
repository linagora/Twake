import RouterService from 'app/services/RouterService';
import { RouterState, RouterWorkspaceSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue, useSetRecoilState } from 'recoil';

export default function useRouterWorkspace() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const workspaceId = useRecoilValue(RouterWorkspaceSelector);

  return workspaceId;
}
