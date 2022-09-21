import React, { useContext, useState } from 'react';
import Message from './message';
import Responses from './responses';
import ReplyBlock from './parts/ReplyBlock';
import LoadMoreReplies from './parts/LoadMoreReplies';
import { MessagesListContext } from '../messages-list';
import ThreadSection from '../parts/thread-section';
import Thread from '../parts/thread';
import { useMessage } from 'app/features/messages/hooks/use-message';
import ActivityMessage, { ActivityType } from './parts/ChannelActivity/ActivityMessage';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';
import { NodeMessage } from 'app/features/messages/types/message';

export const MessageContext = React.createContext({
  companyId: '',
  workspaceId: '',
  channelId: '',
  threadId: '',
  id: '',
});

type Props = {
  companyId: string;
  workspaceId: string;
  channelId: string;
  threadId: string;
  id?: string;
};

export default React.memo(({ threadId, workspaceId, channelId, companyId, id }: Props) => {
  return (
    <MessageContext.Provider
      value={{ companyId, workspaceId, channelId, threadId, id: id || threadId }}
    >
      <MessageType />
    </MessageContext.Provider>
  );
});

const MessageType = () => {
  const listContext = useContext(MessagesListContext);
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  const { highlight } = useHighlightMessage();
  const highlighted =
    (highlight &&
      ((highlight.threadId === context.id && !listContext.hideReplies) ||
        highlight.answerId === context.id)) ||
    false;
  const [firstMessageId, setFirstMessageId] = useState(
    message.last_replies?.[0]?.id || message.thread_id,
  );

  if (message.subtype === 'system') {
    const activity = message?.context?.activity as ActivityType;
    return <ActivityMessage message={message} activity={activity} />;
  }

  return (
    <Thread withBlock={listContext.withBlock} highlighted={highlighted}>
      <HeadMessage />
      {!listContext.hideReplies && (
        <>
          <LoadMoreReplies
            firstMessageId={firstMessageId}
            onFirstMessageChanged={(firstMessage: NodeMessage) => {
              if (firstMessage) setFirstMessageId(firstMessage.id);
            }}
          />
          <Responses
            companyId={context.companyId}
            workspaceId={context.workspaceId}
            channelId={context.channelId}
            threadId={context.threadId}
            firstMessageId={firstMessageId}
          />
          {!listContext.readonly && <ReplyBlock />}
        </>
      )}
    </Thread>
  );
};

const HeadMessage = () => {
  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  return (
    <ThreadSection withAvatar head pinned={!!message.pinned_info?.pinned_at}>
      <Message />
    </ThreadSection>
  );
};
