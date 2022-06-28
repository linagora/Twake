import { ChannelType } from 'app/features/channels/types/channel';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import ChannelAvatar from 'app/components/search-popup/parts/channel-avatar/channel-avatar';
import { openChannel } from '../common';

type PropsType = {
  channel: ChannelType;
};

export default ({ channel }: PropsType): JSX.Element => {
  const currentWorkspaceId = useRouterWorkspace();
  const { setOpen } = useSearchModal();

  return (
    <div
      onClick={() => {
        openChannel(channel, currentWorkspaceId);
        setOpen(false);
      }}
    >
      <ChannelAvatar channel={channel} showLabel={true} collapseToOne={true} />
    </div>
  );
};
