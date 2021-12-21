import RouterService from 'app/services/RouterService';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { RouterState } from 'app/state/recoil/atoms/Router';
import { RouterChannelSelector } from '../../selectors/RouterSelector';

export default function useRouterChannel() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const channelId = useRecoilValue(RouterChannelSelector);

  return channelId;
}
