import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import MessagesListServerService from 'app/services/Apps/Messages/MessagesListServerUtils';
import MessagesListService from 'app/services/Apps/Messages/MessagesListUtils';
import {
  AutoSizer,
  List,
  CellMeasurer,
  CellMeasurerCache,
  InfiniteLoader,
} from 'react-virtualized';

type Props = {
  channel: any;
  threadId: string;
  collectionKey: string;
};

export default class MessagesList extends Component<Props, { messages: number[] }> {
  messagesListServerService: MessagesListServerService;
  messagesListService: MessagesListService;
  virtualizedList: List | null = null;
  cache: CellMeasurerCache = new CellMeasurerCache({
    defaultHeight: 80,
    minHeight: 50,
    fixedWidth: true,
  });

  constructor(props: Props) {
    super(props);
    this.messagesListService = new MessagesListService();
    this.messagesListServerService = new MessagesListServerService(
      this.props.channel.id,
      this.props.threadId,
      this.props.collectionKey,
    );
  }

  componentDidMount() {
    Collections.get('messages').addListener(this);
    this.messagesListServerService.init();
  }

  componentWillUnmount() {
    Collections.get('messages').removeListener(this);
    this.messagesListServerService.destroy();
  }

  componentWillUpdate() {
    this.cache.clearAll(); //Clear the cache if row heights are recompute to be sure there are no "blank spaces" (some row are erased)
    this.virtualizedList && this.virtualizedList.recomputeRowHeights(); //We need to recompute the heights
  }

  render() {
    const messages = this.messagesListServerService.getMessages();
    this.messagesListService.setMessagesCount(messages.length);
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <InfiniteLoader
          isRowLoaded={() => true}
          loadMoreRows={() => new Promise(resolve => resolve(messages))}
          rowCount={messages.length}
        >
          {({ onRowsRendered, registerChild }) => (
            <AutoSizer>
              {({ width, height }) => {
                return (
                  <List
                    scrollToIndex={this.messagesListService.getScrollToIndex()}
                    rowHeight={this.cache.rowHeight}
                    deferredMeasurementCache={this.cache}
                    height={height}
                    width={width}
                    rowCount={messages.length}
                    ref={node => {
                      registerChild(node);
                      this.messagesListService.refList(node);
                      this.virtualizedList = node;
                    }}
                    onRowsRendered={onRowsRendered}
                    onScroll={this.messagesListService.onScroll}
                    rowRenderer={({ index, key, style, parent }: any) => (
                      <CellMeasurer
                        cache={this.cache}
                        columnIndex={0}
                        key={key}
                        parent={parent}
                        rowIndex={index}
                      >
                        <div style={{ borderTop: '1px solid #AAA', ...style }}>
                          {messages[index]?.content?.original_str}
                        </div>
                      </CellMeasurer>
                    )}
                  />
                );
              }}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </div>
    );
  }
}
