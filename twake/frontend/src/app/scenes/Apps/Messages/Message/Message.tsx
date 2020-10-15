import React, { Component } from 'react';
import Globals from 'services/Globals.js';

import { CornerDownRight } from 'react-feather';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';

import Languages from 'services/languages/languages.js';
import FirstMessage from './Parts/FirstMessage/FirstMessage';
import Thread from '../Parts/Thread';
import ThreadSection from '../Parts/ThreadSection';
import MessageContent from './Parts/MessageContent';
import MessagesService from 'services/Apps/Messages/Messages.js';
import UserService from 'services/user/user.js';
import MessageEditorsManager, { MessageEditors } from 'app/services/Apps/Messages/MessageEditors';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import TimeSeparator from './TimeSeparator';
import MessagesListServiceManager, {
  MessagesListUtils as MessagesListService,
} from 'app/services/Apps/Messages/MessagesListUtils';

import Input from '../Input/Input';

import Collections from 'services/Collections/Collections.js';

type Props = {
  fake?: boolean;
  messageId: string;
  collectionKey: string;
  highlighted?: boolean;
  style?: any;
  delayRender?: boolean;
  noReplies?: boolean;
  noBlock?: boolean;
  repliesAsLink?: boolean;
  unreadAfter?: number;
};

export default class MessageComponent extends Component<Props, { render: boolean }> {
  domNode: any;
  messageEditorService: MessageEditors;
  allowUpdates: boolean = false;
  message: Message;

  constructor(props: Props) {
    super(props);

    this.state = {
      render: !props.delayRender,
    };

    this.getResponses = this.getResponses.bind(this);
    this.setDomElement = this.setDomElement.bind(this);

    this.message =
      Collections.get('messages').find(props.messageId) ||
      Collections.get('messages').findByFrontId(props.messageId);

    let savedLength = 0;
    Collections.get('messages').addListener(
      this,
      [props.messageId || this.message?.front_id],
      () => {
        const length = this.getResponses().length;
        if (length != savedLength) {
          savedLength = length;
          return true;
        }
        return false;
      },
    );

    this.messageEditorService = MessageEditorsManager.get(this.message?.channel_id || '');
    let savedCurrentEditor: string | false = '';
    this.messageEditorService.addListener(this, [], () => {
      if (
        this.messageEditorService.currentEditorMessageId === props.messageId ||
        this.messageEditorService.currentEditorThreadId === props.messageId ||
        savedCurrentEditor === props.messageId
      ) {
        savedCurrentEditor = props.messageId;
        return true;
      }
      savedCurrentEditor = '';
      return false;
    });

    if (this.message) {
      MessagesListServiceManager.get(this.props.collectionKey).setMessageNode(this.message, this);
    }
  }

  getDomElement() {
    return this.domNode;
  }

  setDomElement(node: any) {
    this.domNode = node;
  }

  startRenderContent() {
    if (!this.state.render) {
      this.setState({ render: true });
    }
  }

  stopRenderContent() {
    if (this.state.render) {
      this.setState({ render: false });
    }
  }

  isRendered() {
    return this.state.render;
  }

  dropMessage(message: any) {
    //@ts-ignore
    if (Globals.window.mixpanel_enabled) {
      //@ts-ignore
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Send respond Event');
      //@ts-ignore
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Drop message Event');
    }
    MessagesService.dropMessage(message, this.message, this.props.collectionKey);
  }

  getResponses() {
    const message = this.message;
    if (!message) {
      return [];
    }
    return Collections.get('messages')
      .findBy({
        channel_id: message.channel_id,
        parent_message_id: message.id,
        _user_ephemeral: undefined,
      })
      .filter((i: Message) => !i._user_ephemeral)
      .sort((a: Message, b: Message) => (a.creation_date || 0) - (b.creation_date || 0));
  }

  render() {
    if (this.props.fake === true) {
      return <Thread loading refDom={this.setDomElement} />;
    }

    const message = this.message;

    if (message?.hidden_data?.type === 'init_channel') {
      if (!this.state.render) {
        return <div ref={this.setDomElement} />;
      }
      return <FirstMessage refDom={this.setDomElement} channelId={message.channel_id || ''} />;
    }

    const max_responses = 3;
    let previous_message: Message = message;
    let responses = this.getResponses();

    const linkToThread = !!message.parent_message_id && this.props.repliesAsLink;

    const showInput = this.messageEditorService.currentEditor === message?.id;

    const canDropIn =
      !message.parent_message_id && !message._user_ephemeral && message.message_type !== 2;

    return (
      <DroppableZone
        deactivated={!canDropIn}
        types={['message']}
        onDrop={(data: any) => this.dropMessage(data.data)}
      >
        <Thread
          collectionKey={this.props.collectionKey}
          refDom={this.setDomElement}
          threadId={message?.id || ''}
          highlighted={this.props.highlighted}
          hidden={!this.state.render}
          withBlock={!message.parent_message_id && !this.props.noBlock}
          canDrag={!(this.props.repliesAsLink && message.parent_message_id)}
          message={message}
          className={canDropIn ? 'has-droppable ' : ''}
        >
          <ThreadSection
            small={linkToThread}
            message={message}
            head
            delayRender={!this.state.render}
          >
            <MessageContent
              key={message?._last_modified || message?.front_id}
              linkToThread={linkToThread}
              message={message}
              collectionKey={this.props.collectionKey}
              edited={this.messageEditorService.currentEditorMessageId === message.id}
            />
          </ThreadSection>

          {!this.props.noReplies && responses.length > max_responses && (
            <ThreadSection gradient>
              <div className="message-content">
                <a
                  onClick={() => {
                    MessagesService.showMessage(message.id);
                  }}
                  href="#"
                >
                  {Languages.t('scenes.apps.messages.message.show_responses_button')} (
                  {message.responses_count})
                </a>
              </div>
            </ThreadSection>
          )}

          {!this.props.noReplies &&
            responses.slice(-max_responses).map((message: Message) => {
              if (!message) {
                return '';
              }
              const tmp_previous_message = previous_message;
              previous_message = message;
              return [
                <TimeSeparator
                  key={message.front_id + '_time'}
                  messageId={message?.id || ''}
                  previousMessageId={tmp_previous_message?.id || ''}
                  unreadAfter={this.props.unreadAfter || 0}
                />,
                <ThreadSection
                  canDrag
                  alinea
                  message={message}
                  small
                  delayRender={!this.state.render}
                  key={message.front_id}
                >
                  <MessageContent
                    message={message}
                    collectionKey={this.props.collectionKey}
                    edited={this.messageEditorService.currentEditorMessageId === message.id}
                  />
                </ThreadSection>,
              ];
            })}

          {!this.props.noReplies && showInput && (
            <ThreadSection alinea small message={{ sender: UserService.getCurrentUserId() }}>
              <div className="message-content">
                <Input
                  channelId={message?.channel_id || ''}
                  threadId={message?.id || ''}
                  collectionKey={this.props.collectionKey}
                />
              </div>
            </ThreadSection>
          )}
          {!showInput && !this.props.noReplies && !message.parent_message_id && (
            <ThreadSection compact>
              <div className="message-content">
                <a
                  href="#"
                  onClick={() => this.messageEditorService.openEditor(message?.id || '', '')}
                >
                  <CornerDownRight size={14} />{' '}
                  {Languages.t('scenes.apps.messages.message.reply_button')}
                </a>
              </div>
            </ThreadSection>
          )}
        </Thread>
      </DroppableZone>
    );
  }
}
