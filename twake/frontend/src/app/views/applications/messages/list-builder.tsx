import React, {
  forwardRef,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ItemContent, LogLevel, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { WindowType } from 'app/features/messages/hooks/use-add-to-windowed-list';
import _ from 'lodash';

export type ListBuilderHandle = VirtuosoHandle & {
  append: (messages: any[]) => void;
};

type Props = {
  initialItems: any[];
  loadMore: (direction: 'history' | 'future', limit: number, offset?: any) => Promise<any[]>;
  itemContent: ItemContent<any, any>;
  itemId: (item: any) => string;
  emptyListComponent: ReactNode;
  atBottomStateChange?: (atBottom: boolean) => void;
  window: WindowType;
  onScroll: Function;
  style?: any;
};

let prependMoreLock = false;
let appendMoreLock = false;

export default React.memo(
  forwardRef(
    (
      {
        emptyListComponent,
        itemId,
        loadMore,
        onScroll,
        initialItems,
        itemContent,
        atBottomStateChange,
        window,
        style,
      }: Props,
      ref,
    ) => {
      const START_INDEX = 10000000;
      const INITIAL_ITEM_COUNT = (initialItems || []).length;

      const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
      const [items, setItems] = useState(initialItems || []);
      const refVirtuoso = useRef<VirtuosoHandle>(null);

      useImperativeHandle(
        ref,
        () =>
          ({
            ...refVirtuoso.current,
            append(messages: any[]) {
              console.log('append from parent', messages);
              const newItems = _.differenceBy(messages, items, itemId);
              console.log('newItems transactional append received', newItems);
              const newList = [...items, ...newItems];
              setItems(() => newList);
            },
          } as ListBuilderHandle),
      );

      const appendItems = useCallback(() => {
        console.log('loadMore append items');
        if (appendMoreLock) return;
        appendMoreLock = true;

        setTimeout(async () => {
          const newItems = _.differenceBy(
            await loadMore('future', 20, items[items.length - 1]),
            items,
            itemId,
          );
          console.log('newItems append received', newItems);
          const newList = [...items, ...newItems];
          setItems(() => newList);
          appendMoreLock = false;
        }, 10);

        return false;
      }, [firstItemIndex, items, setItems]);

      const prependItems = useCallback(() => {
        console.log('loadMore prepend items', items);
        if (prependMoreLock) return;
        prependMoreLock = true;

        setTimeout(async () => {
          const newItems = _.differenceBy(await loadMore('history', 20, items[0]), items, itemId);
          console.log('newItems prepend received', newItems);
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
          ref={refVirtuoso}
          style={style}
          followOutput={'smooth'}
          alignToBottom={true}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
          data={items}
          startReached={prependItems}
          endReached={appendItems}
          itemContent={itemContent}
          onScroll={e => onScroll(e)}
          atBottomStateChange={atBottomStateChange}
          computeItemKey={(_index, item) => itemId(item)}
        />
      );
    },
  ),
);
