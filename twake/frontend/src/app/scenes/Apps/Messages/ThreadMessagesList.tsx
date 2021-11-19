import React from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Thread from './Thread';
import { Virtuoso } from 'react-virtuoso';
import Message from './Message';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  const { messages } = useThreadMessages({ companyId, threadId });
  return (
    <div>
      <Virtuoso
        totalCount={messages.length}
        itemContent={index => (
          <Message
            companyId={messages[index].companyId}
            threadId={messages[index].threadId}
            messageId={messages[index].id}
          />
        )}
      />
    </div>
  );
};
