import { useRecoilValue, useSetRecoilState } from 'recoil';
import RouterService from 'app/services/RouterService';
import { RouterState } from 'app/state/recoil/atoms/Router';
import { RouterWorkspaceSelector } from '../../selectors/RouterSelector';

export default function useRouterWorkspace() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const workspaceId = useRecoilValue(RouterWorkspaceSelector);

  return workspaceId;
}
