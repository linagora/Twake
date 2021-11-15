import { RouterState, RouterWorkspaceSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import RouterService from '../RouterService';

export default function useRouterWorkspace() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const workspaceId = useRecoilValue(RouterWorkspaceSelector);

  return workspaceId;
}
