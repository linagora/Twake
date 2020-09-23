import React, { Component } from 'react';
import MessagesListServerServicesManager, {
  MessagesListServerUtils,
  Message,
} from 'app/services/Apps/Messages/MessagesListServerUtils';
import MessagesListServiceManager, {
  MessagesListUtils as MessagesListService,
} from 'app/services/Apps/Messages/MessagesListUtils';
import MessageComponent from './Message/Message';
import TimeSeparator from './Message/TimeSeparator';
import WindowService from 'services/utils/window.js';
import ChannelsService from 'services/channels/channels.js';
import Collections from 'services/Collections/Collections.js';
import Languages from 'services/languages/languages.js';
import { ArrowDown } from 'react-feather';
import WritingUsers from './Input/WritingUsers';
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

  jumpBottom() {
    if (this.messagesListServerService.hasLastMessage()) {
      this.messagesListService.scrollTo(true);
    } else {
      this.messagesListServerService.init(true).then(() => {
        this.messagesListService.scrollTo(true);
      });
    }
  }

  componentDidMount() {
    const mid = WindowService.getInfoFromUrl()?.message;
    if (mid) {
      //Can jump on init to message
      this.jumpTo(mid);
    } else {
      this.jumpBottom();
    }
    this.messagesListServerService.addListener(this);
    this.messagesListService.addListener(this);
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
    const loadingMessagesTop: any[] = this.messagesListService.getLoadingMessages(
      this.messagesListServerService,
      'top',
    );
    const loadingMessagesBottom: any[] =
      messages.length > 0
        ? this.messagesListService.getLoadingMessages(this.messagesListServerService, 'bottom')
        : [];
    this.messagesListService.updateScroll();

    const headerMessage =
      this.props.threadId && Collections.get('messages').find(this.props.threadId);

    return [
      <div
        className={
          'messages-scroller-parent ' + (this.messagesListService.fixBottom ? '' : 'scrolled-up ')
        }
      >
        <div
          key="messages"
          style={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto' }}
          ref={this.messagesListService.setScroller}
        >
          <div className="messages-list" ref={this.messagesListService.setMessagesContainer}>
            <div className="fake-messages">
              {loadingMessagesTop.map((_m, index) => (
                <MessageComponent
                  delayRender
                  style={{}}
                  key={index}
                  message={loadingMessagesTop[index]}
                  collectionKey={this.props.collectionKey}
                />
              ))}
            </div>

            {loadingMessagesTop.length == 0 && this.props.threadId && headerMessage && (
              <div className="message_header">
                <MessageComponent
                  noReplies
                  style={{}}
                  key={headerMessage?.id}
                  message={headerMessage}
                  collectionKey={this.props.collectionKey}
                />
              </div>
            )}

            {messages.map((m, index) => {
              return [
                <TimeSeparator
                  key={messages[index].front_id + '_time'}
                  message={messages[index]}
                  previousMessage={messages[index - 1]}
                  unreadAfter={this.props.unreadAfter}
                />,
                <MessageComponent
                  delayRender
                  repliesAsLink
                  style={{}}
                  key={messages[index].front_id}
                  message={messages[index]}
                  highlighted={this.messagesListService.highlighted === messages[index]?.id}
                  ref={node => this.messagesListService.setMessageNode(m, node)}
                  collectionKey={this.props.collectionKey}
                />,
              ];
            })}
            <div className="fake-messages">
              {loadingMessagesBottom.map((_m, index) => (
                <MessageComponent
                  delayRender
                  style={{}}
                  key={index}
                  message={loadingMessagesBottom[index]}
                  collectionKey={this.props.collectionKey}
                />
              ))}
            </div>
          </div>
        </div>
        <div
          className={'go-to-now '}
          key="go-to-now"
          onClick={() => {
            this.jumpBottom();
          }}
        >
          <ArrowDown size={16} />{' '}
          {Languages.t('scenes.apps.messages.messageslist.go_last_message_button')}
        </div>
        <WritingUsers channelId={this.props.channel.id} threadId={this.props.threadId} />
      </div>,
    ];
  }
}
