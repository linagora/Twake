import React, { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { ItemContent, LogLevel, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Logger from 'app/features/global/framework/logger-service';
import { WindowType } from 'app/features/messages/hooks/use-add-to-windowed-list';
import { MessagesPlaceHolder } from './placeholder';
import { useHighlightMessage } from 'app/features/messages/hooks/use-highlight-message';

//@ts-ignore
globalThis.VIRTUOSO_LOG_LEVEL = LogLevel.DEBUG;

const logger = Logger.getLogger(`ListBuilder`);
const START_INDEX = 1000000;
const IDENTIFIER = 'threadId';

type Props = {
  items: any[];
  loadMore: (direction: 'history' | 'future') => Promise<void>;
  itemContent: ItemContent<any, any>;
  itemId: (item: any) => string;
  emptyListComponent: ReactNode;
  atBottomStateChange?: (atBottom: boolean) => void;
  window: WindowType;
  onScroll: Function;
  refVirtuoso: React.Ref<VirtuosoHandle>;
};

export default React.memo(
  ({
    refVirtuoso: virtuosoRef,
    emptyListComponent,
    itemId,
    loadMore,
    onScroll,
    items,
    itemContent,
    atBottomStateChange,
    window,
  }: Props) => {
    const [initiated, setInitiated] = useState(false);

    const more = async (direction: 'future' | 'history') => {
      const result = await loadMore(direction);
      setInitiated(true);
      return result;
    };

    useEffect(() => {
      if (!window.loaded) {
        more('history').then(() => {
          if (atBottomStateChange) atBottomStateChange(true);
        });
      } else {
        more('future');
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
      return (
        <div style={{ flex: 1 }}>
          {initiated ? emptyListComponent || <></> : <MessagesPlaceHolder />}
        </div>
      );
    }

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
              await more('history');
            }}
            endReached={async () => {
              if (!window.reachedEnd) await more('future');
            }}
            atBottomStateChange={atBottomStateChange}
            atTopStateChange={atTop => {}}
            computeItemKey={(_index, item) => itemId(item)}
            onScroll={() => onScroll()}
          />
        </Suspense>
      </>
    );
  },
);
