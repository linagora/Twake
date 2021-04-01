import React, { createRef, RefObject } from 'react';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessagesListServerUtils';
import WindowService from 'services/utils/window';
import ChannelsService from 'services/channels/channels';
import Logger from 'app/services/Logger';
import MessageAndTimeSeparator from './Message/MessageAndTimeSeparator';
import GoToBottom from './Parts/GoToBottom';
import { Message } from 'app/services/Apps/Messages/Message';
import { MessageLoader } from 'app/services/Apps/Messages/MessageLoader';

const START_INDEX = 100000;
const DEFAULT_PAGE_SIZE = 25;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const LoadComponent = () => <Spin indicator={antIcon} />;
const LoaderComponent = () => (
  <div className="loading-full">
    <div className="loading">
      <LoadComponent/>
    </div>
  </div>
);

type Props = {
  channel: any;
  threadId: string;
  collectionKey: string;
  unreadAfter: number;
  pageSize?: number;
  /**
   * The initial scroll direction
   */
  scrollDirection: "up" | "down";
};

type State = {
  showBottomButton: boolean;
  isLoaded: boolean;
  items: Message[];
};

export default class MessagesList extends React.Component<Props, State> {
  private logger: Logger.Logger;
  private loader: MessageLoader;
  private pageSize: number;
  private virtuosoRef: RefObject<VirtuosoHandle>;
  private isLoading: boolean;
  private nbOfCalls: number;
  private topHasBeenReached: boolean;
  private bottomHasBeenReached: boolean;
  private upOffset: string;
  private downOffset: string;
  private firstItemIndex: number;
  private lastItemIndex: number;
  private isInitialized: boolean;
  /**
   * The initial page size computed after the first fetch;
   * Since this is a reverse infinite scroll, we need to get this first size before to render the list...
   */
  private initialPageSize: number;
  private position: "top" | "bottom" | "middle" | "unknown";
  private scrolling: boolean;
  
  constructor(props: Props) {
    super(props);
    this.nbOfCalls = 0;
    this.isLoading = false;
    this.topHasBeenReached = false;
    this.bottomHasBeenReached = false;
    this.upOffset = "";
    this.downOffset = "";
    this.logger = Logger.getLogger(`Apps/Messages/MessageList/Channel/${props.channel.id}`);
    this.virtuosoRef = createRef();
    this.pageSize = props.pageSize || DEFAULT_PAGE_SIZE;
    this.initialPageSize = this.pageSize;
    this.firstItemIndex = START_INDEX;
    this.lastItemIndex = START_INDEX + this.pageSize;
    this.position = "unknown";
    this.isInitialized = false;
    this.scrolling = false;
    this.loader = MessagesListServerServicesManager.get(
      props.channel.company_id,
      props.channel.workspace_id,
      props.channel.id,
      props.threadId,
      props.collectionKey,
    );
    this.state = {
      showBottomButton: false,
      isLoaded: false,
      items: [],
    };
  }

  async componentDidMount() {
    await this.init();
    await this.nextPage(this.props.scrollDirection);
    this.initialPageSize = this.state.items.length || this.pageSize;
    this.setIsLoaded(true);
    this.loader.addListener(this);
  }

  componentWillUnmount() {
    this.loader.destroy();
    this.loader.removeListener(this);
  }

  setIsLoaded(isLoaded: boolean) {
    this.setState(() => ({
      isLoaded,
    }));
  }

  setItems(items: Message[] = []) {
    this.setState(() => ({
      items,
    }));
  }

  setShowBottomButton(showBottomButton: boolean) {
    this.setState(() => ({
      showBottomButton,
    }));
  }

  async nextPage(direction: "up" | "down" = "up"): Promise<void> {
    this.logger.debug(`loadMore:${direction}`);
    if (this.isLoading) {
      this.logger.debug(`loadMore:${direction} - Loading already in progress`);
      return;
    }

    if (!this.isInitialized) {
      this.logger.debug(`loadMore:${direction} - Not initialized`);
      return;
    }

    if (direction === "up" && this.topHasBeenReached) {
      this.logger.debug(`loadMore:${direction} - Top has already been reached`);
      return;
    }
    
    if (direction === "down" && this.bottomHasBeenReached) {
      this.logger.debug(`loadMore:${direction} - Bottom has already been reached`);
      return;
    }

    const offset = direction === "up" ? this.upOffset : this.downOffset;
    this.logger.debug(`loadMore:${direction}, offset:${offset}`)

    this.nbOfCalls++;
    this.isLoading = true;
    const response = await this.loader.nextPage({ direction, offset });
    this.isLoading = false;
    this.logger.debug(`loadMore:${direction} - Loader response`, response);

    if (!response.loaded) {
      this.logger.debug("No data loaded, skipping...");
      //return;
    }

    this.downOffset = response.offsets.down;
    this.upOffset = response.offsets.up;
    this.topHasBeenReached = response.completes.top;
    this.bottomHasBeenReached = response.completes.bottom;

    const items = response.items || [];

    if (!items.length) {
      return;
    }

    direction === "up" ? this.firstItemIndex = (this.firstItemIndex - items.length) : (this.lastItemIndex = this.lastItemIndex + items.length);
    // prepend / append items in the list so that the infinite view is updated
    direction === "up" ? this.setItems([...items, ...this.state.items]) : this.setItems([...this.state.items, ...items])
  };

  async init() {
    this.logger.debug("Initializing message feed");
    const messageId = WindowService.getInfoFromUrl()?.message;
    
    await this.loader.init({ offset: (messageId && !this.props.threadId) ? messageId : "", pageSize: this.pageSize }, {
      onCreated: this.onMessagesCreated.bind(this),
      onUpdated: this.onMessagesUpdated.bind(this),
      onDeleted: this.onMessagesDeleted.bind(this),
    });

    // FIXME: Don't know why
    if (messageId) {
      ChannelsService.url_values.message = false; //Not the best place for this
    }
    this.isInitialized = true;
  };

  /**
   * if message is a reply, we scroll to the end of the message parent
   * else we scroll to the message itself
   * @param align 
   * @param message 
   * @returns 
   */
  scrollToMessage(align: "start" | "center" | "end" = "start", message?: Message): void {
    // TODO: in case of reply, we can also have the message in the "main" stream
    // Check if the message is in the index of messages, if so choose where to scroll
    const isReply = message?.parent_message_id;
    const id = isReply ? message?.parent_message_id : message?.id;
    const index = message ? this.state.items.findIndex(m => m.id === id) : this.lastItemIndex;

    if (index < 0) {
      return;
    }

    this.logger.debug("Scrollto", index);
    this.virtuosoRef.current?.scrollToIndex({
      align: isReply ? "end" : align,
      index,
      behavior: 'auto',
    });
  }

  isBottomMessage(message: Message): boolean {
    const id = message.parent_message_id || message.id;
    const messageIndex = this.state.items.findIndex(m => m.id === id);

    return messageIndex !== -1 && messageIndex === this.state.items.length -1;
  }

  isScrolling(scrolling: any) {
    // TODO: To be used in sub components
    this.scrolling = scrolling;
  }

  async onMessagesCreated(messages: Message[] = []): Promise<void> {
    this.logger.debug("Messages has been created", messages);
    if (!messages.length) {
      return;
    }

    const message = messages[0];
    const previousPosition = this.position;
    
    // This is false
    //this.downOffset = message.id || message.front_id || "";
    //this.bottomHasBeenReached = false;

    // we should only be able to get the new message from the loader
    const items = this.loader.getItems() || [];

    if (items.length) {
      //this.setItems([...items]);
      // TODO: Update the indexes; the last one should be increased by one...
    }

    // hope that the render occured just above and so we can check if this is a bottom message
    // TODO: The message can also be a reploy to something, so that we should scroll if it is the response of the last message...

    const isBottom = this.isBottomMessage(message);
    this.logger.debug("Message is bottom one?", isBottom);
    
    if (isBottom && (previousPosition === "bottom" || previousPosition === "unknown")) {
      this.scrollToMessage("start", message);
    }
  }
  
  onMessagesUpdated(messages: Message[]): void {
    this.logger.debug("Messages has been updated");
    // TODO update the message and call for render...
  }
  
  onMessagesDeleted(messages: Message[]): void {
    this.logger.debug("Messages has been deleted");
  }

  onRangeChanged(range: ListRange): void {
    // TODO: If needed, this can be used to display the gotobottom button more precisely.
    // this.logger.debug("Range changed", range);
  }

  render() {
    return (
      <>
      { !this.state.isLoaded
        ? <LoaderComponent/>
        : <div
            style={{width: '100%', height: '100%'}}
            className={this.state.showBottomButton ? "messages-list scrolled-up" : "messages-list"}
          >
            <Virtuoso
              ref={this.virtuosoRef}
              overscan={{ main: 1000, reverse: 1000 }}
              firstItemIndex={this.firstItemIndex}
              initialTopMostItemIndex={this.initialPageSize - 1}
              data={this.state.items}
              startReached={() => this.nextPage("up")}
              endReached={() => this.nextPage("down")}
              isScrolling={(value) => this.isScrolling(value)}
              rangeChanged={(range) => this.onRangeChanged(range)}
              itemContent={(index: number, message: Message) => {
                return (
                  <MessageAndTimeSeparator
                    key={message.id || message.front_id}
                    messageId={message.id || message.front_id || ""}
                    threadHeader={this.props.threadId}
                    previousMessageId={this.state.items[index - 1]?.id || ""}
                    unreadAfter={this.props.unreadAfter}
                    // TODO
                    //const highlighted = messagesListService.highlighted === messages[index]?.id;
                    highlighted={false}
                    collectionKey={this.props.collectionKey}
                    repliesAsLink={!this.props.threadId}
                  />
              );}}
              atBottomStateChange={atBottom => {
                this.position = atBottom ? "bottom" : "middle";
                this.setShowBottomButton(!atBottom);
              }}
              atTopStateChange={atTop => {
                this.position = atTop ? "top" : "middle";
              }}
              components={{
                Header: () => {
                  return (
                    <div className="header" style={{ display: 'flex', justifyContent: 'center' }}>
                      {
                        this.topHasBeenReached || this.nbOfCalls < 1
                        ?
                        <></>
                        :
                        <div className="header-loader"><LoadComponent/></div>
                      }
                    </div>
                  );
                },
              }}
            />
            <GoToBottom jumpBottom={() => this.scrollToMessage("end")} />
          </div>
        }
      </>
    );
  }
}
