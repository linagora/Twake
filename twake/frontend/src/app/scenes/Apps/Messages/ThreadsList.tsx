import React, { Suspense, useEffect, useRef, useState } from 'react';
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
  const { messages, loadMore } = useChannelMessages({ companyId, workspaceId, channelId });
  useEffect(() => {
    (async () => {
      loadMore('history');
    })();
  }, []);
  return (
    <>
      <Virtuoso
        ref={virtuosoRef}
        initialTopMostItemIndex={messages.length - 1}
        totalCount={messages.length}
        itemContent={index => (
          <Suspense fallback="">
            <Thread companyId={messages[index].companyId} threadId={messages[index].threadId} />
          </Suspense>
        )}
        followOutput={'smooth'}
        overscan={200}
        startReached={async () => {
          console.log('called loadMore history');
          await loadMore('history');
        }}
        endReached={async () => {
          console.log('called loadMore future');
          //await loadMore();
        }}
      />
    </>
  );
};
