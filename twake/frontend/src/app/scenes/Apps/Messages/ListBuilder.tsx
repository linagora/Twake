import React, { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { ItemContent, Virtuoso } from 'react-virtuoso';
import Logger from 'app/services/Logger';

const logger = Logger.getLogger(`ListBuilder`);
const START_INDEX = 1000000;
const IDENTIFIER = 'threadId';

type Props = {
  items: any[];
  loadMore: (direction: 'history' | 'future') => Promise<void>;
  itemContent: ItemContent<any>;
  itemId: (item: any) => string;
  emptyListComponent: ReactNode;
};

export default React.memo(({ emptyListComponent, itemId, loadMore, items, itemContent }: Props) => {
  const virtuosoRef = useRef(null);
  const initiated = useRef(false);

  const more = async (direction: 'future' | 'history') => {
    logger.log('Load more ', direction);
    const result = await loadMore(direction);
    initiated.current = true;
    return result;
  };

  useEffect(() => {
    if (items.length === 0) {
      more('history');
    }
  }, []);

  const firstItemIndex = useRef(START_INDEX);
  const firstItemId = useRef('');
  if (items.length > 0) {
    if (firstItemId.current) {
      firstItemIndex.current =
        firstItemIndex.current - items.map(i => itemId(i)).indexOf(firstItemId.current);
    }
    firstItemId.current = itemId(items[0]);
  }

  if (items.length === 0) {
    return <div style={{ flex: 1 }}>{initiated.current ? emptyListComponent || <></> : <></>}</div>;
  }

  logger.log('firstItemIndex: ', firstItemIndex.current, 'items length: ', items.length);

  return (
    <>
      <Suspense fallback={<div style={{ flex: 1 }}></div>}>
        <Virtuoso
          ref={virtuosoRef}
          initialTopMostItemIndex={items.length - 1}
          firstItemIndex={firstItemIndex.current}
          itemContent={itemContent}
          data={items}
          followOutput={'smooth'}
          alignToBottom
          startReached={async () => {
            logger.log('startReached: ', items.length);
            await more('history');
            logger.log('loaded history: ', items.length);
          }}
          endReached={async () => {
            logger.log('endReached: ', items.length);
            await more('future');
            logger.log('loaded future: ', items.length);
          }}
          atBottomStateChange={atBottom => logger.log('position: atBottom', atBottom)}
          atTopStateChange={atTop => {
            logger.log('position: atTop', atTop);
          }}
          computeItemKey={(_index, item) => itemId(item)}
          //overscan={{ main: 1000, reverse: 1000 }}
        />
      </Suspense>
    </>
  );
});
