import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import MessagesListServerService, {
  Message,
} from 'app/services/Apps/Messages/MessagesListServerUtils';
import MessagesListService from 'app/services/Apps/Messages/MessagesListUtils';
import MessageComponent from './Message/Message';
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
    minHeight: 20,
    fixedWidth: true,
  });

  constructor(props: Props) {
    super(props);
    this.messagesListServerService = new MessagesListServerService(
      this.props.channel.id,
      this.props.threadId,
      this.props.collectionKey,
    );
    this.messagesListService = new MessagesListService(this.messagesListServerService);

    //@ts-ignore
    window.MessagesList = this;
  }

  componentDidMount() {
    Collections.get('messages').addListener(this);
    this.messagesListServerService.init();
  }

  componentWillUnmount() {
    Collections.get('messages').removeListener(this);
    this.messagesListServerService.destroy();
    this.messagesListService.unsetScroller();
    this.messagesListService.unsetMessagesContainer();
  }

  componentWillUpdate() {
    //this.resetList();
  }

  resetList() {
    this.cache.clearAll(); //Clear the cache if row heights are recompute to be sure there are no "blank spaces" (some row are erased)
    this.virtualizedList && this.virtualizedList.recomputeRowHeights(); //We need to recompute the heights
  }

  render() {
    const messages: any[] = this.messagesListServerService.getMessages();
    const loadingMessagesTop: any[] = this.messagesListService.getLoadingMessages(
      this.messagesListServerService,
      'top',
    );
    const loadingMessagesBottom: any[] = this.messagesListService.getLoadingMessages(
      this.messagesListServerService,
      'bottom',
    );
    this.messagesListService.updateScroll();

    return (
      <div
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto' }}
        ref={this.messagesListService.setScroller}
        onClick={() => {
          this.messagesListServerService.loadMore();
        }}
      >
        <div className="messages-list" ref={this.messagesListService.setMessagesContainer}>
          <div className="fake-messages">
            {loadingMessagesTop.map((_m, index) => (
              <MessageComponent style={{}} key={index} message={loadingMessagesTop[index]} />
            ))}
          </div>
          {messages.map((_m, index) => (
            <MessageComponent style={{}} key={messages[index].id} message={messages[index]} />
          ))}
          <div className="fake-messages">
            {loadingMessagesBottom.map((_m, index) => (
              <MessageComponent style={{}} key={index} message={loadingMessagesBottom[index]} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
