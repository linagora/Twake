import React, { createRef, RefObject } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessageLoaderFactory';
import Logger from 'app/services/Logger';
import MessageAndTimeSeparator from './Message/MessageAndTimeSeparator';
import GoToBottom from './Parts/GoToBottom';
import { Message } from 'app/services/Apps/Messages/Message';
import { MessageLoader } from 'app/services/Apps/Messages/MessageLoader';
import RouterServices from 'app/services/RouterService';
import MessageComponent from './Message/Message';
import { FeedResponse } from 'app/services/Apps/Feed/FeedLoader';

const START_INDEX = 100000;
const DEFAULT_PAGE_SIZE = 25;

type ScrollDirection =  "up" | "down";
type ScrollPosition = "top" | "bottom" | "middle" | "unknown";

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
  messages: Message[];
  newMessages: number;
};

export default class MessagesList extends React.Component<Props, State> {
  private logger: Logger.Logger;
  private loader: MessageLoader;
  private pageSize: number;
  private virtuosoRef: RefObject<VirtuosoHandle>;
  private loading: {
    [ key in ScrollDirection ]: boolean
  };
  private nbOfCalls: {
    [ key in ScrollDirection ]: number
  };
  private topHasBeenReached: boolean;
  private bottomHasBeenReached: boolean;
  private firstItemIndex: number;
  private isInitialized: boolean;
  /**
   * The initial page size computed after the first fetch;
   * Since this is a reverse infinite scroll, we need to get this first size before to render the list...
   */
  private initialPageSize: number;
  private initialTopMostItemIndex: number;
  private position: ScrollPosition;
  private scrolling: boolean;
  /**
   * Locking the scroll up when we display a thread
   */
  private lockScrollUp: boolean;
  private startAtOffset: string;
  
  constructor(props: Props) {
    super(props);
    this.nbOfCalls = { up: 0, down: 0 };
    this.loading = { up: false, down: false };
    this.lockScrollUp = !!this.props.threadId;
    this.topHasBeenReached = this.lockScrollUp;
    this.bottomHasBeenReached = false;
    this.logger = Logger.getLogger(`Apps/Messages/MessageList/Channel/${props.channel.id}`);
    this.virtuosoRef = createRef();
    this.pageSize = props.pageSize || DEFAULT_PAGE_SIZE;
    this.initialTopMostItemIndex = 0;
    this.initialPageSize = this.pageSize;
    this.firstItemIndex = START_INDEX;
    this.startAtOffset = '';
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
      newMessages: 0,
      isLoaded: false,
      messages: [],
    };
    this.onNewCollectionEvent = this.onNewCollectionEvent.bind(this);
  }

  async componentDidMount() {
    this.startAtOffset = RouterServices.getStateFromRoute().messageId || '';
    const startFrom = this.startAtOffset || this.props.threadId || '';
    const direction = startFrom ? 'down' : 'up';

    const initResponse = await this.init({ startFrom, direction });
    this.processLoaderResponse(initResponse, direction);
    this.initialPageSize = this.state.messages.length || this.pageSize;
    if (direction === 'up') {
      // Set the initial index at bottom on first load when loading the feed from the end
      // TODO: In case we want to start at a given position (first unread for example), we can change the value here
      this.initialTopMostItemIndex = this.state.messages.length;
    } else {
      // when loading the feed at a given message, keep the initial index at the start
      this.initialTopMostItemIndex = 0;
    }
    this.isInitialized = true;
    this.setState({ isLoaded: true });
    this.loader.addListener(this.onNewCollectionEvent);
  }

  componentWillUnmount() {
    this.loader.destroy();
    this.loader.removeListener(this.onNewCollectionEvent);
  }

  private init(params: { startFrom: string, direction: ScrollDirection }): Promise<FeedResponse<Message>> {
    this.logger.debug("Initializing message list feed with parameters", params);
    this.loading = { down: false, up: false };
    return this.loader.init({ offset: params.startFrom, pageSize: this.pageSize, direction: params.direction });
  };

  /**
   * The collection has been updated, update the items to dispatch a new render
   * TODO: Update the firstItemIndex
   */
  private onNewCollectionEvent(data_: any): void {
    const messages = this.loader.getItems() || [];
    const diff = messages.length - this.state.messages.length;

    if (diff === 0) {
      this.logger.debug("Some Messages have been updated");
      // or some has been deleted and created at the same time...
      // or this is a response to a thread and so there are no items length diff
    } else if (diff > 0) {
      this.setState({ newMessages: diff });
      this.logger.debug(`${diff} new messages`);
    } else if (diff < 0) {
      this.logger.debug(`${diff} less messages`);
    }
    
    if (messages.length) {
      const previousPosition = this.position;

      this.setMessages(messages);

      if (["bottom", "unknown"].includes(previousPosition)) {
        // This may not work in case of a reply
        this.scrollToMessage("end", messages[messages.length - 1])
      }
    }
  }

  /**
   * Called with true when the list reaches bottom, or with false when was at the bottom and starting scrolling up
   * 
   * @param atBottom 
   */
  private onBottomUpdate(atBottom: boolean) {
    this.position = atBottom ? "bottom" : "middle";
    this.setShowBottomButton(!atBottom);

    atBottom && this.setState({ newMessages: 0 });
  }

  private async nextPage(direction: ScrollDirection = "up"): Promise<void> {
    this.logger.debug(`nextPage:${direction}`);
    if (this.loading[direction]) {
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

    this.nbOfCalls[direction]++;
    this.loading[direction] = true;
    const response = await this.loader.nextPage({ direction });
    this.loading[direction] = false;
    
    this.processLoaderResponse(response, direction);
  };

  private processLoaderResponse(response: FeedResponse<Message>, direction: ScrollDirection): void {
    this.logger.debug(`processLoaderResponse:${direction} - Loader response`, response);

    if (!response.loaded) {
      this.logger.debug("processLoaderResponse - No messages loaded");
    }
    
    this.topHasBeenReached = response.completes.top;
    this.bottomHasBeenReached = response.completes.bottom;
    
    let messages = response.items || [];
    
    if (!messages.length) {
      this.logger.debug("processLoaderResponse - No messages in the feed response");
      return;
    }

    if (direction === "up") {
      // last item of the response is the same as the first one of the state (we paginated from it and it may be included in the response)
      if (this.state.messages.length && messages[messages.length - 1].id === this.state.messages[0].id) {
        messages.splice(messages.length - 1, 1);
      }

      this.firstItemIndex = this.firstItemIndex - messages.length;
      this.setMessages([...messages, ...this.state.messages]);
    }

    if (direction === "down") {
      // first item of the page if the same as the last one of the state (we paginated from it and it may be included in the response)
      if (this.state.messages.length && messages[0].id === this.state.messages[this.state.messages.length - 1].id) {
        messages.shift();
      }
      this.setMessages([...this.state.messages, ...messages])
    }
  }

  scrollToMessage(align: "start" | "center" | "end" = "start", message?: Message): void {
    if (!message) {
      this.setState(() => ({ newMessages: 0 }));
      // TODO: If the current scroll is not far from the target, we can smoothly scroll, else set it to auto
      const behavior = 'smooth';
      this.virtuosoRef.current?.scrollToIndex({
        align,
        index: this.state.messages.length,
        behavior,
      });
    }
  }

  /**
   *
   * @param isAtBottom
   * @returns true or smooth to ask to follow the output when new messages are added at the end of the list
   */
  followOuput(isAtBottom: boolean): boolean | 'smooth' {
    let result = isAtBottom;
    if (this.startAtOffset) {
      // Do not follow until the user chose to scroll to bottom
      result = false;
    }

    return result;
  }

  isBottomMessage(message: Message): boolean {
    const id = message.parent_message_id || message.id;
    const messageIndex = this.state.messages.findIndex(m => m.id === id);

    return messageIndex !== -1 && messageIndex === this.state.messages.length -1;
  }

  isScrolling(scrolling: any) {
    // TODO: To be used in sub components
    this.scrolling = scrolling;
  }

  setMessages(messages: Message[] = []) {
    this.setState(() => ({
      messages,
    }));
  }

  setShowBottomButton(showBottomButton: boolean) {
    this.setState(() => ({
      showBottomButton,
    }));
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
              initialTopMostItemIndex={this.initialTopMostItemIndex}
              data={this.state.messages}
              startReached={() => this.nextPage("up")}
              endReached={() => this.nextPage("down")}
              isScrolling={(value) => this.isScrolling(value)}
              followOutput={(isAtBottom) => this.followOuput(isAtBottom)}
              itemContent={(index: number, message: Message) => {
                return (
                  <MessageAndTimeSeparator
                    key={message.id || message.front_id}
                    messageId={message.id || message.front_id || ""}
                    threadHeader={this.props.threadId}
                    previousMessageId={this.state.messages[index - 1]?.id || ""}
                    unreadAfter={this.props.unreadAfter}
                    // TODO
                    //const highlighted = messagesListService.highlighted === messages[index]?.id;
                    highlighted={false}
                    collectionKey={this.props.collectionKey}
                    repliesAsLink={!this.props.threadId}
                  />
              );}}
              atBottomStateChange={atBottom => this.onBottomUpdate(atBottom)}
              atTopStateChange={atTop => {
                this.position = atTop ? "top" : "middle";
              }}
              components={{
                Header: () => {
                  return (
                    <div className="header" style={{ display: 'flex', justifyContent: 'center' }}>
                      {
                        this.lockScrollUp || this.topHasBeenReached
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
            <GoToBottom
              onClick={ () => this.scrollToMessage("end") }
              newMessages={ this.state.newMessages }
            />
          </div>
        }
      </>
    );
  }
}
