import React from 'react';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import Message from './message';
import { MessageContext } from './message-with-replies';
import ThreadSection from '../parts/thread-section';
import { useMessage } from 'app/features/messages/hooks/use-message';
import Numbers from 'app/features/global/utils/Numbers';

type Props = {
  companyId: string;
  threadId: string;
  firstMessageId: string;
};

export default ({ threadId, companyId, firstMessageId }: Props) => {
  let { messages } = useThreadMessages({ companyId, threadId });

  return (
    <>
      {messages
        .filter(m => !firstMessageId || Numbers.compareTimeuuid(m.id, firstMessageId) >= 0)
        .map(m => {
          return (
            <MessageContext.Provider key={m.id} value={{ ...m, id: m.id || '' }}>
              <Reply />
            </MessageContext.Provider>
          );
        })}
    </>
  );
};

const Reply = () => {
  const context = React.useContext(MessageContext);
  const { message } = useMessage(context);
  return (
    <ThreadSection withAvatar alinea small pinned={!!message.pinned_info?.pinned_by}>
      <Message />
    </ThreadSection>
  );
};
