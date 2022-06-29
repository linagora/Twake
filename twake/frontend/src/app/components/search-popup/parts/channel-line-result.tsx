import * as Text from '@atoms/text';
import { ChannelType } from 'app/features/channels/types/channel';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { SearchInputState } from 'app/features/search/state/search-input';
import ChannelAvatar from 'app/components/search-popup/parts/channel-avatar/channel-avatar';
import Highlighter from 'react-highlight-words';
import { useRecoilValue } from 'recoil';
import { openChannel } from '../common';

type PropsType = {
  channel: ChannelType;
};

export default ({ channel }: PropsType): JSX.Element => {
  const currentWorkspaceId = useRouterWorkspace();
  const input = useRecoilValue(SearchInputState);
  const name = channel.name;
  const { setOpen } = useSearchModal();

  return (
    <div
      className="flex items-center p-2 hover:bg-zinc-50 rounded-md cursor-pointer"
      onClick={() => {
        openChannel(channel, currentWorkspaceId);
        setOpen(false);
      }}
    >
      <div className="mr-3">
        <ChannelAvatar channel={channel} showLabel={false} collapseToOne={true} />
      </div>
      <div className="grow mr-3">
        <Text.Base className="block">
          <Highlighter
            highlightClassName="text-blue-500 p-0 bg-blue-50"
            searchWords={input?.query?.split(' ')}
            autoEscape={true}
            textToHighlight={name}
          />
        </Text.Base>
        <Text.Info className="block">{channel?.stats?.members} members</Text.Info>
      </div>
      <div>{/*Actions todo*/}</div>
    </div>
  );
};
