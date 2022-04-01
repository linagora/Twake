import React from 'react';
import { useThreadMessages } from 'app/features/messages/hooks/use-thread-messages';
import Message from './message';
import { MessageContext } from './message-with-replies';
import ThreadSection from '../parts/thread-section';
import { useMessage } from 'app/features/messages/hooks/use-message';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  let { messages } = useThreadMessages({ companyId, threadId });

  return (
    <>
      {messages.map(m => {
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
