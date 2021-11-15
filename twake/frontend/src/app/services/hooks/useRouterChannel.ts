import { RouterState, RouterChannelSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import RouterService from '../RouterService';

export default function useRouterChannel() {
  const setClientState = useSetRecoilState(RouterState);
  RouterService.setRecoilState = setClientState;
  const channelId = useRecoilValue(RouterChannelSelector);

  return channelId;
}
