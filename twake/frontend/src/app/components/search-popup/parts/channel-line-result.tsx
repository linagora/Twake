import * as Text from '@atoms/text';
import { ChannelType } from 'app/features/channels/types/channel';
import { SearchInputState } from 'app/features/search/state/search-input';
import ChannelAvatar from 'components/channel-avatar/channel-avatar';
import Highlighter from 'react-highlight-words';
import { useRecoilValue } from 'recoil';

type PropsType = {
  channel: ChannelType;
};

export default ({ channel }: PropsType): JSX.Element => {
  const input = useRecoilValue(SearchInputState);
  const name = channel.name;

  return (
    <div className="flex items-center p-2 hover:bg-zinc-50 rounded-md cursor-pointer">
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
        <Text.Info className="block">{channel.members_count} members</Text.Info>
      </div>
      <div>Actions todo</div>
    </div>
  );
};
