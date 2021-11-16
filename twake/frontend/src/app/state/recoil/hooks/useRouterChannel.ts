import RouterService from 'app/services/RouterService';
import { RouterState, RouterChannelSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue, useSetRecoilState } from 'recoil';

export default function useRouterChannel() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const channelId = useRecoilValue(RouterChannelSelector);

  return channelId;
}
