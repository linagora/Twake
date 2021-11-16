import React, { Suspense, useRef } from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Thread from './Thread';
import { Virtuoso } from 'react-virtuoso';

type Props = {
  companyId: string;
  workspaceId: string;
  channelId: string;
};

export default ({ channelId, companyId, workspaceId }: Props) => {
  const virtuosoRef = useRef(null);
  const messages = useChannelMessages({ companyId, workspaceId, channelId });
  return (
    <div>
      <Virtuoso
        ref={virtuosoRef}
        initialTopMostItemIndex={messages.length - 1}
        style={{ height: '400px' }}
        totalCount={messages.length}
        itemContent={index => (
          <Thread companyId={messages[index].companyId} threadId={messages[index].threadId} />
        )}
        followOutput={'smooth'}
      />
    </div>
  );
};
