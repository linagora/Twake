import React, { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ItemContent, LogLevel, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Logger from 'app/features/global/framework/logger-service';
import { WindowType } from 'app/features/messages/hooks/use-add-to-windowed-list';
import { MessagesPlaceHolder } from './placeholder';
import _ from 'lodash';

//@ts-ignore
globalThis.VIRTUOSO_LOG_LEVEL = LogLevel.DEBUG;

const logger = Logger.getLogger(`ListBuilder`);
const START_INDEX = 1000000;
const IDENTIFIER = 'threadId';

type Props = {
  initialItems: any[];
  loadMore: (direction: 'history' | 'future', limit: number, offset?: any) => Promise<any[]>;
  itemContent: ItemContent<any, any>;
  itemId: (item: any) => string;
  emptyListComponent: ReactNode;
  atBottomStateChange?: (atBottom: boolean) => void;
  window: WindowType;
  onScroll: Function;
  refVirtuoso: React.Ref<VirtuosoHandle>;
};

let prependMoreLock = false;
let appendMoreLock = false;

export default React.memo(
  ({
    refVirtuoso: virtuosoRef,
    emptyListComponent,
    itemId,
    loadMore,
    onScroll,
    initialItems,
    itemContent,
    atBottomStateChange,
    window,
  }: Props) => {
    const START_INDEX = 10000000;
    const INITIAL_ITEM_COUNT = (initialItems || []).length;

    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
    const [items, setItems] = useState(initialItems || []);

    const appendItems = useCallback(() => {
      console.log('vir append items');
      if (appendMoreLock) return;
      appendMoreLock = true;

      setTimeout(async () => {
        const newItems = await loadMore('future', 20, items[items.length - 1]);
        const newList = _.uniqBy([...items, ...newItems], itemId);
        setItems(() => newList);
        appendMoreLock = false;
      }, 10);

      return false;
    }, [firstItemIndex, items, setItems]);

    const prependItems = useCallback(() => {
      console.log('vir prepend items');
      if (prependMoreLock) return;
      prependMoreLock = true;

      setTimeout(async () => {
        const newItems = await loadMore('history', 20, items[0]);
        const newList = _.uniqBy([...newItems, ...items], itemId);
        const nextFirstItemIndex = firstItemIndex - (newList.length - items.length);
        setFirstItemIndex(() => nextFirstItemIndex);
        setItems(() => newList);
        prependMoreLock = false;
      }, 10);

      return false;
    }, [firstItemIndex, items, setItems]);

    console.log('vir items:', items);

    return (
      <Virtuoso
        ref={virtuosoRef}
        alignToBottom={true}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
        data={items}
        startReached={prependItems}
        endReached={appendItems}
        itemContent={itemContent}
        onScroll={() => onScroll()}
        atBottomStateChange={atBottomStateChange}
        computeItemKey={(_index, item) => itemId(item)}
      />
    );
  },
);
