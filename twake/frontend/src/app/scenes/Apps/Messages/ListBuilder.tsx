import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useChannelMessages, useThreadMessages } from 'app/state/recoil/hooks/useMessages';
import Thread from './Message/MessageWithReplies';
import { ItemContent, Virtuoso } from 'react-virtuoso';
import GoToBottom from './Parts/GoToBottom';

const START_INDEX = 1000000;
const IDENTIFIER = 'threadId';

type Props = {
  items: any[];
  loadMore: (direction: 'history' | 'future') => void;
  itemContent: ItemContent<any>;
  itemId: (item: any) => string;
};

export default ({ itemId, loadMore, items, itemContent }: Props) => {
  const virtuosoRef = useRef(null);
  useEffect(() => {
    (async () => {
      loadMore('history');
    })();
  }, []);

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  const [firstItemId, setFirstItemId] = useState('');
  useEffect(() => {
    if (items.length > 0) {
      if (firstItemId) {
        setFirstItemIndex(firstItemIndex - items.map(i => itemId(i)).indexOf(firstItemId));
      }
      setFirstItemId(itemId(items[0]));
    }
  }, [items]);

  if (items.length === 0) {
    return <></>;
  }

  return (
    <>
      <Virtuoso
        ref={virtuosoRef}
        initialTopMostItemIndex={items.length - 1}
        firstItemIndex={firstItemIndex}
        itemContent={itemContent}
        data={items}
        followOutput={'smooth'}
        startReached={async () => {
          console.log('called loadMore history');
          setTimeout(() => {
            loadMore('history');
          }, 500);
        }}
        endReached={async () => {
          console.log('called loadMore future');
          //await loadMore();
        }}
        atBottomStateChange={atBottom => console.log('position: atBottom', atBottom)}
        atTopStateChange={atTop => {
          console.log('position: atTop', atTop);
        }}
        overscan={1000}
      />
    </>
  );
};
