import React from 'react';
import { useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Message from './Message';
import TimeSeparator from './TimeSeparator';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  let { messages } = useThreadMessages({ companyId, threadId });
  //TODO use window to open more or less messages here

  console.log(messages);
  return (
    <>
      Réponses: <br />
      {messages.map(m => {
        return <Message companyId={m.companyId} threadId={m.threadId} id={m.id || ''} />;
      })}
    </>
  );
};
