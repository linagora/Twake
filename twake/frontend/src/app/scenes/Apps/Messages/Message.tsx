import React from 'react';
import { useMessage, useThreadMessages } from 'app/state/recoil/hooks/useMessages';

type Props = {
  companyId: string;
  threadId: string;
  messageId: string;
};

export default ({ threadId, companyId, messageId }: Props) => {
  let message = useMessage({ companyId, threadId, id: messageId });
  return (
    <div style={{ border: '1px solid black', padding: 8 }}>
      {message.user_id}: {message.text}
    </div>
  );
};
