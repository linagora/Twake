import React, {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ItemContent, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import _ from 'lodash';

export type ListBuilderHandle = VirtuosoHandle & unknown;

type Props = {
  items: any[];
  followOutput: false | 'smooth' | 'auto';
  loadMore: (direction: 'history' | 'future', limit: number, offset?: any) => Promise<unknown[]>;
  itemContent: ItemContent<any, any>;
  itemId: (item: any) => string;
  emptyListComponent: ReactNode;
  onScroll: (e: React.UIEvent<'div', UIEvent>) => void;
  style?: React.CSSProperties;
  atBottomStateChange?: (atBottom: boolean) => void;
  //Will be called just before to finish append messages for a final filtering
  filterOnAppend?: (item: any[]) => any[];
};

let prependMoreLock = false;
let appendMoreLock = false;

export default React.memo(
  forwardRef(
    (
      {
        emptyListComponent,
        filterOnAppend,
        followOutput,
        itemId,
        loadMore,
        onScroll,
        items: _items,
        itemContent,
        atBottomStateChange,
        style,
      }: Props,
      ref,
    ) => {
      const START_INDEX = 10000000;
      const INITIAL_ITEM_COUNT = (_items || []).length;

      const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
      const [items, setItems] = useState(_items || []);
      const refVirtuoso = useRef<VirtuosoHandle>(null);

      useImperativeHandle(ref, () => ({
        ...refVirtuoso.current,
      }));

      useEffect(() => {
        // Detect append or prepend or full replace items
        const ids = items.map(i => itemId(i));
        //Find the first index in props _items that is already in displayed items
        const first = _items.findIndex(i => ids.includes(itemId(i)));
        //Find the last index in props _items that is already in displayed items
        const lastIndex = _items
          .slice()
          .reverse()
          .findIndex(i => ids.includes(itemId(i)));
        const last = lastIndex >= 0 ? _items.length - 1 - lastIndex : lastIndex;
        if (first == -1) {
          //Replacement
          setFirstItemIndex(START_INDEX);
          setItems(_items);
        } else if (first === 0 && last !== _items.length - 1) {
          //Append
          let newList = [...items, ..._items.slice(last + 1)];
          if (filterOnAppend) newList = filterOnAppend(newList);
          setItems(newList);
        } else if (last === _items.length - 1 && first !== 0) {
          //Prepend
          const newItems = _items.slice(0, first);
          const nextFirstItemIndex = firstItemIndex - newItems.length;
          setFirstItemIndex(() => nextFirstItemIndex);
          setItems([...newItems, ...items]);
        } else {
          if (filterOnAppend) {
            const newList = filterOnAppend([...items, ..._items]);
            if (
              _.difference(
                items.map(i => itemId(i)),
                newList.map(i => itemId(i)),
              ).length > 0
            ) {
              setItems(newList);
            }
          }
        }
      }, [_items]);

      const appendItems = useCallback(() => {
        if (appendMoreLock) return;
        appendMoreLock = true;

        setTimeout(async () => {
          await loadMore('future', 20, items[items.length - 1]);
          appendMoreLock = false;
        }, 10);

        return false;
      }, [items]);

      const prependItems = useCallback(() => {
        if (prependMoreLock) return;
        prependMoreLock = true;

        setTimeout(async () => {
          await loadMore('history', 20, items[0]);
          prependMoreLock = false;
        }, 10);

        return false;
      }, [items]);

      if (items.length === 0) {
        return <div style={{ flex: 1 }}>{emptyListComponent}</div>;
      }

      return (
        <Virtuoso
          ref={refVirtuoso}
          style={style}
          followOutput={followOutput}
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
