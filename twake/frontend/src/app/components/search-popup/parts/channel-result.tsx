import '../search-popup.scss';

import { ChannelType } from 'app/features/channels/types/channel';
import ChannelAvatar from 'components/channel-avatar/channel-avatar';

type PropsType = {
  channel: ChannelType;
};

export default ({ channel }: PropsType): JSX.Element => {
  return <ChannelAvatar channel={channel} showLabel={true} collapseToOne={true} />;
};
