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

import Input from '../Input/Input';

import Collections from 'services/Collections/Collections.js';

type Props = {
  message: Message & { fake: boolean };
  collectionKey: string;
  highlighted?: boolean;
  style?: any;
  delayRender?: boolean;
  noReplies?: boolean;
  noBlock?: boolean;
  repliesAsLink?: boolean;
  unreadAfter?: number;
};

export default class MessageComponent extends Component<
  Props,
  { history: number; render: boolean }
> {
  domNode: any;
  messageEditorService: MessageEditors;
  allowUpdates: boolean = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      history: 5,
      render: !props.delayRender,
    };

    this.setDomElement = this.setDomElement.bind(this);
    this.messageEditorService = MessageEditorsManager.get(props.message?.channel_id || '');
    let savedCurrentEditor: string | false = '';
    this.messageEditorService.addListener(this, () => {
      if (
        this.messageEditorService.currentEditorMessageId === this.props.message?.id ||
        this.messageEditorService.currentEditorThreadId === this.props.message?.id ||
        savedCurrentEditor === this.props.message?.id
      ) {
        savedCurrentEditor = this.props.message?.id;
        return true;
      }
      savedCurrentEditor = '';
      return false;
    });
    Collections.get('messages').addListener(this);
    Collections.get('messages').listenOnly(this, [props.message.id || props.message.front_id]);
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
    MessagesService.dropMessage(message, this.props.message, this.props.collectionKey);
  }

  render() {
    if (this.props.message.fake === true) {
      return <Thread loading refDom={this.setDomElement} />;
    }

    const message =
      Collections.get('messages').find(this.props.message.id) ||
      Collections.get('messages').findByFrontId(this.props.message.front_id);

    if (message?.hidden_data?.type === 'init_channel') {
      if (!this.state.render) {
        return <div ref={this.setDomElement} />;
      }
      return <FirstMessage refDom={this.setDomElement} channelId={message.channel_id || ''} />;
    }

    const max_responses = this.state.history;
    let previous_message: Message = message;
    let responses = Collections.get('messages')
      .findBy({
        channel_id: message.channel_id,
        parent_message_id: message.id,
        _user_ephemeral: undefined,
      })
      .filter((i: Message) => !i._user_ephemeral)
      .sort((a: Message, b: Message) => (a.creation_date || 0) - (b.creation_date || 0));

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
                  message={message}
                  previousMessage={tmp_previous_message}
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
