import React, { createRef, RefObject } from 'react';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessageLoaderFactory';
import WindowService from 'services/utils/window';
import Logger from 'app/services/Logger';
import MessageAndTimeSeparator from './Message/MessageAndTimeSeparator';
import GoToBottom from './Parts/GoToBottom';
import { Message } from 'app/services/Apps/Messages/Message';
import { MessageLoader } from 'app/services/Apps/Messages/MessageLoader';
import MessageComponent from './Message/Message';

const START_INDEX = 100000;
const DEFAULT_PAGE_SIZE = 25;

type ScrollDirection =  "up" | "down";

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const LoadComponent = () => <Spin indicator={antIcon} />;
const FullPageLoaderComponent = () => (
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
  scrollDirection: ScrollDirection;
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
  private lockScrollUp: boolean;
  
  constructor(props: Props) {
    super(props);
    this.nbOfCalls = 0;
    this.isLoading = false;
    this.lockScrollUp = !!this.props.threadId;
    this.topHasBeenReached = this.lockScrollUp;
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
    this.onNewCollectionEvent = this.onNewCollectionEvent.bind(this);
  }

  async componentDidMount() {
    const startFrom = WindowService.getInfoFromUrl()?.message || this.props.threadId || '';

    await this.init({ startFrom });
    await this.nextPage(this.props.scrollDirection);
    this.initialPageSize = this.state.items.length || this.pageSize;
    // FIXME: lastItemIndex must be updated
    this.setIsLoaded(true);
    this.loader.addListener(this.onNewCollectionEvent);
  }

  componentWillUnmount() {
    this.loader.destroy();
    this.loader.removeListener(this.onNewCollectionEvent);
  }

  /**
   * The collection has been updated, update the items to dispatch a new render
   * TODO: Update the firstItemIndex
   */
  private onNewCollectionEvent(data_: any): void {
    const items = this.loader.getItems() || [];
    const diff = items.length - this.state.items.length;

    if (diff === 0) {
      this.logger.debug("Some Messages have been updated");
      // or some has been deleted and created at the same time...
      // or this is a response to a thread and so there are no items length diff
    } else if (diff > 0) {
      this.logger.debug(`${diff} new messages`);
    } else if (diff < 0) {
      this.logger.debug(`${diff} less messages`);
    }
    
    if (items.length) {
      const previousPosition = this.position;

      this.setItems(items);

      if (["bottom", "unknown"].includes(previousPosition)) {
        // This may not work in case of a reply
        this.scrollToMessage("end", items[items.length - 1])
      }
    }
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

  async init(params: { startFrom: string }): Promise<void> {
    this.logger.debug("Initializing message list feed with parameters", params);
    this.isLoading = false;
    await this.loader.init({ offset: params.startFrom, pageSize: this.pageSize, direction: this.props.threadId ? 'down' : 'up' });
    this.isInitialized = true;
  };

  async nextPage(direction: ScrollDirection = "up"): Promise<void> {
    this.logger.debug(`nextPage:${direction}`);
    if (this.isLoading) {
      this.logger.debug(`nextPage:${direction} - Loading already in progress`);
      return;
    }

    if (!this.isInitialized) {
      this.logger.debug(`nextPage:${direction} - Not initialized`);
      return;
    }

    if (this.lockScrollUp && direction === "up") {
      this.logger.debug(`nextPage:${direction} - Scroll up is not allowed`);
      return;
    }

    if (direction === "up" && this.topHasBeenReached) {
      this.logger.debug(`nextPage:${direction} - Top has already been reached`);
      return;
    }
    
    if (direction === "down" && this.bottomHasBeenReached) {
      this.logger.debug(`nextPage:${direction} - Bottom has already been reached`);
      return;
    }

    this.nbOfCalls++;
    this.isLoading = true;
    const response = await this.loader.nextPage({ direction });
    this.isLoading = false;
    this.logger.debug(`nextPage:${direction} - Loader response`, response);

    if (!response.loaded) {
      this.logger.debug("No data loaded, skipping...");
      //return;
    }

    this.downOffset = response.offsets.down;
    this.upOffset = response.offsets.up;
    this.topHasBeenReached = response.completes.top;
    this.bottomHasBeenReached = response.completes.bottom;

    let items = response.items || [];

    if (!items.length) {
      return;
    }

    if (direction === "up") {
      // last item of the response is the same as the first one of the state (we paginated from it and it may be included in the response)
      if (this.state.items.length && items[items.length - 1].id === this.state.items[0].id) {
        items.splice(items.length - 1, 1);
      }
    }

    if (direction === "down") {
      // first item of the page if the same as the last one of the state (we paginated from it and it may be included in the response)
      if (this.state.items.length && items[0].id === this.state.items[this.state.items.length - 1].id) {
        items.shift();
      }
    }

    // update the indexes so that the infinite scroll scroller is up to date and does not tilt
    direction === "up" ? this.firstItemIndex = (this.firstItemIndex - items.length) : (this.lastItemIndex = this.lastItemIndex + items.length);
    // prepend / append items in the list so that the infinite view is updated
    direction === "up" ? this.setItems([...items, ...this.state.items]) : this.setItems([...this.state.items, ...items])
  };

  /**
   * if message is a reply, we scroll to the end of the message parent
   * else we scroll to the message itself
   * @param align 
   * @param message 
   * @returns 
   */
  scrollToMessage(align: "start" | "center" | "end" = "start", message?: Message): void {
    const isReply = !!message?.parent_message_id;
    const id = isReply ? message?.parent_message_id : message?.id;
    // TODO: Findthe right index in virtuoso array
    const index = message ? this.state.items.findIndex(m => m.id === id) : this.lastItemIndex;

    if (index < 0) {
      return;
    }

    this.logger.debug("Scrollto", index, "messageId", id, "isReply", isReply, "lastItemIndex", this.lastItemIndex);
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

  onRangeChanged(range: ListRange): void {
    // TODO: If needed, this can be used to display the gotobottom button more precisely.
    // this.logger.debug("Range changed", range);
  }

  render() {
    return (
      <>
      { !this.state.isLoaded
        ? <FullPageLoaderComponent/>
        : <div
            style={{width: '100%', height: '100%'}}
            className={this.state.showBottomButton ? "messages-list scrolled-up" : "messages-list"}
          >
            {this.props.threadId && 
              // TODO: be sure that the message is loaded...
              // TODO: This message can be displayed before any other one just after the init
              // TODO: We can also push it in the loader as first position because for now it is not returned in the getItems but it should...
              (<MessageComponent
                noReplies
                threadHeader={this.props.threadId}
                key={this.props.threadId}
                messageId={this.props.threadId}
                collectionKey={this.props.collectionKey}
              />
            )}
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
                        this.lockScrollUp || this.topHasBeenReached || this.nbOfCalls === 0
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
