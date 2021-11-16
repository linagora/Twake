import { RouterChannelSelectedSelector } from 'app/state/recoil/atoms/Router';
import { useRecoilValue } from 'recoil';

export default function useRouterChannelSelected(channelId: string) {
  return useRecoilValue(RouterChannelSelectedSelector(channelId));
}
