import RouterService from 'app/services/RouterService';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { RouterState } from 'app/state/recoil/atoms/Router';
import { RouterTabSelector } from '../../selectors/RouterSelector';

export default function useRouterTab() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const channelId = useRecoilValue(RouterTabSelector);

  return channelId;
}
