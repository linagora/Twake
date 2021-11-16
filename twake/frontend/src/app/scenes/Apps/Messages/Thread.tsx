import React from 'react';
import { useMessage, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Message from './Message';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  let messages = useThreadMessages({ companyId, threadId });
  return (
    <div style={{ border: '1px solid black', padding: 8 }}>
      <Message companyId={companyId} threadId={threadId} messageId={threadId} />
      ---
      {messages.map(m => (
        <Message companyId={companyId} threadId={threadId} messageId={m.id} />
      ))}
      <br /> <br />
    </div>
  );
};
