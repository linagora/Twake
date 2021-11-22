import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Thread from './Message/MessageWithReplies';
import { ItemContent, Virtuoso } from 'react-virtuoso';

type Props = {
  items: any[];
  loadMore: (direction: 'history' | 'future') => void;
  itemContent: ItemContent<any>;
};

export default ({ loadMore, items, itemContent }: Props) => {
  const virtuosoRef = useRef(null);
  useEffect(() => {
    (async () => {
      loadMore('history');
    })();
  }, []);
  return (
    <>
      <Virtuoso
        ref={virtuosoRef}
        initialTopMostItemIndex={items.length - 1}
        totalCount={items.length}
        itemContent={itemContent}
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
