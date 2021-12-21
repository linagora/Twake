import { useRecoilValue } from 'recoil';
import { RouterChannelSelectedSelector } from '../../selectors/RouterSelector';

export default function useRouterChannelSelected(channelId: string) {
  return useRecoilValue(RouterChannelSelectedSelector(channelId));
}
