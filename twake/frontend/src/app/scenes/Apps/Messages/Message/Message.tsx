import React from 'react';
import { useMessage, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Message from '../_Message/Message';
import Thread from '../Parts/Thread';
import TimeSeparator from './TimeSeparator';

type Props = {
  companyId: string;
  threadId: string;
  id: string;
};

export default ({ companyId, threadId, id }: Props) => {
  let message = useMessage({ companyId, threadId, id });
  return (
    <>
      {message.text}
      <br />
    </>
  );
};
