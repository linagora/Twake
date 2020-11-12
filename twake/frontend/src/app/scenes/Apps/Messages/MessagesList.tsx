import React, { Component } from 'react';
import MessagesListServerServicesManager, {
  MessagesListServerUtils,
} from 'app/services/Apps/Messages/MessagesListServerUtils';
import MessagesListServiceManager, {
  MessagesListUtils as MessagesListService,
} from 'app/services/Apps/Messages/MessagesListUtils';
import MessageComponent from './Message/Message';
import MessageAndTimeSeparator from './Message/MessageAndTimeSeparator';
import WindowService from 'services/utils/window.js';
import ChannelsService from 'services/channels/channels.js';
import Collections from 'services/Collections/Collections.js';
import GoToBottom from './Parts/GoToBottom';
import ScrollerParent from './Parts/ScrollerParent';
import WritingUsers from './Input/WritingUsers';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Loader from 'components/Loader/Loader.js';

type Props = {
  channel: any;
  threadId: string;
  collectionKey: string;
  unreadAfter: number;
};

export default class MessagesList extends Component<Props> {
  messagesListServerService: MessagesListServerUtils;
  messagesListService: MessagesListService;

  constructor(props: Props) {
    super(props);
    this.messagesListServerService = MessagesListServerServicesManager.get(
      this.props.channel.id,
      this.props.threadId,
      this.props.collectionKey,
    );
    this.messagesListService = MessagesListServiceManager.get(
      this.props.collectionKey,
      this.messagesListServerService,
    );

    //@ts-ignore
    window.MessagesList = this;
  }

  jumpTo(messageId: string) {
    this.messagesListServerService.init(messageId).then(() => {
      ChannelsService.url_values.message = false; //Not the best place for this
      this.messagesListService.scrollToMessage({ id: messageId });
      this.messagesListServerService.notify();
      this.messagesListServerService.loadMore();
    });
  }

  jumpBottom(init?: boolean) {
    if (!init && this.messagesListServerService.hasLastMessage()) {
      this.messagesListService.scrollTo(true);
    } else {
      this.messagesListServerService.init(true).then(() => {
        this.messagesListService.scrollTo(true);
      });
    }
  }

  componentDidMount() {
    const mid = WindowService.getInfoFromUrl()?.message;
    if (mid && !this.props.threadId) {
      //Can jump on init to message
      this.jumpTo(mid);
    } else {
      this.jumpBottom(true);
    }
    this.messagesListServerService.addListener(this);
  }

  componentWillUnmount() {
    this.messagesListServerService.removeListener(this);
    this.messagesListService.removeListener(this);
    this.messagesListServerService.destroy();
    this.messagesListService.unsetScroller();
    this.messagesListService.unsetMessagesContainer();
  }

  render() {
    const messages: any[] = this.messagesListServerService.getMessages();
    let loadingMessagesTop: any[] = this.messagesListService.getLoadingMessages(
      this.messagesListServerService,
      'top',
    );
    let loadingMessagesBottom: any[] =
      messages.length > 0
        ? this.messagesListService.getLoadingMessages(this.messagesListServerService, 'bottom')
        : [];
    this.messagesListService.updateScroll();

    const headerMessage =
      this.props.threadId && Collections.get('messages').find(this.props.threadId);

    if (headerMessage) {
      loadingMessagesTop = [];
      loadingMessagesBottom = [];
    }

    if (messages.length === 0 && !this.messagesListServerService.hasLastMessage()) {
      return (
        <div className="loading-full">
          <div className="loading">
            <Loader color="#CCC" className="app_loader" />
          </div>
        </div>
      );
    }

    return [
      <ScrollerParent messagesListService={this.messagesListService}>
        <PerfectScrollbar
          options={{ suppressScrollX: true }}
          component="div"
          style={{ width: '100%', height: '100%', position: 'relative' }}
          containerRef={this.messagesListService.setScroller}
        >
          <div className="messages-list" ref={this.messagesListService.setMessagesContainer}>
            <div className="fake-messages">
              {loadingMessagesTop.map((_m, index) => (
                <MessageComponent
                  delayRender
                  key={index}
                  fake
                  messageId={''}
                  collectionKey={this.props.collectionKey}
                />
              ))}
            </div>

            {loadingMessagesTop.length == 0 && this.props.threadId && headerMessage && (
              <div className="message_header">
                <MessageComponent
                  noReplies
                  key={headerMessage?.id}
                  messageId={headerMessage?.id}
                  collectionKey={this.props.collectionKey}
                />
              </div>
            )}

            {messages.map((m, index) => {
              const highlighted = this.messagesListService.highlighted === messages[index]?.id;
              return (
                <MessageAndTimeSeparator
                  delayRender
                  key={messages[index].front_id}
                  messageId={messages[index]?.id || messages[index]?.front_id}
                  previousMessageId={messages[index - 1]?.id}
                  unreadAfter={this.props.unreadAfter}
                  highlighted={highlighted}
                  collectionKey={this.props.collectionKey}
                  repliesAsLink={!this.props.threadId}
                />
              );
            })}
            <div className="fake-messages">
              {loadingMessagesBottom.map((_m, index) => (
                <MessageComponent
                  delayRender
                  key={index}
                  fake
                  messageId={''}
                  collectionKey={this.props.collectionKey}
                />
              ))}
            </div>
          </div>
        </PerfectScrollbar>
        <GoToBottom jumpBottom={() => this.jumpBottom()} />
        <WritingUsers channelId={this.props.channel.id} threadId={this.props.threadId} />
      </ScrollerParent>,
    ];
  }
}
