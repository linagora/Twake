import React from 'react';
import Message from './Message';
import Responses from './Responses';

type Props = {
  companyId: string;
  threadId: string;
};

export default ({ threadId, companyId }: Props) => {
  return (
    <>
      <br />
      <Message companyId={companyId} threadId={threadId} id={threadId} />
      <Responses companyId={companyId} threadId={threadId} />
    </>
  );
};
