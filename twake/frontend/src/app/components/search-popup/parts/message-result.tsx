import A from '@atoms/link';
import * as Text from '@atoms/text';
import { formatDate } from '@features/global/utils/format-date';
import { Message } from '@features/messages/types/message';
import ChannelAvatar from 'app/components/channel-avatar/channel-avatar';
import { useChannel } from 'app/features/channels/hooks/use-channel';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useUser } from 'app/features/users/hooks/use-user';
import { useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useRecoilValue } from 'recoil';
import ResultContext from './result-context';

export default ({ message }: { message: Message }) => {
  const input = useRecoilValue(SearchInputState);
  const user = useUser(message.user_id || '');
  const { channel } = useChannel(message?.cache?.channel_id || '');
  const [truncated, setTruncated] = useState(true);

  console.log(user);

  return (
    <div className="block w-full flex items-start p-2 hover:bg-zinc-50 rounded-md cursor-pointer">
      <div className="mr-3">
        {channel && <ChannelAvatar channel={channel} showLabel={false} collapseToOne={true} />}
      </div>
      <div className="grow mr-3">
        <div className="messages-title">
          <ResultContext
            user={user}
            context={{
              companyId: message?.cache?.company_id,
              workspaceId: message?.cache?.workspace_id,
              channelId: message?.cache?.channel_id,
            }}
          />
        </div>
        <div className="messages-text">
          <Text.BaseSmall className="block whitespace-pre-line">
            <Highlighter
              highlightClassName="text-blue-500 p-0 bg-blue-50"
              searchWords={input?.query?.split(' ')}
              autoEscape={true}
              textToHighlight={message.text?.substring(0, truncated ? 500 : message.text.length)}
            />
            {truncated && (message.text?.length || 0) > 500 && (
              <A className="ml-3" onClick={() => setTruncated(false)}>
                See more
              </A>
            )}
          </Text.BaseSmall>
        </div>
        <Text.Info className="block">{formatDate(message.created_at)}</Text.Info>
      </div>
    </div>
  );
};
