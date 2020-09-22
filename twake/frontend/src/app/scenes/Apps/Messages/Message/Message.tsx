import React, { Component } from 'react';
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

import Input from '../Input/Input';

import Collections from 'services/Collections/Collections.js';

type Props = {
  message: Message & { fake: boolean };
  previousMessage?: Message;
  collectionKey: string;
  highlighted?: boolean;
  style: any;
  delayRender?: boolean;
  noReplies?: boolean;
  repliesAsLink?: boolean;
};

export default class MessageComponent extends Component<
  Props,
  { history: number; render: boolean }
> {
  domNode: any;
  messageEditorService: MessageEditors;

  constructor(props: Props) {
    super(props);

    this.state = {
      history: 5,
      render: !props.delayRender,
    };

    this.setDomElement = this.setDomElement.bind(this);
    this.messageEditorService = MessageEditorsManager.get(props.message?.channel_id || '');
    this.messageEditorService.addListener(this);
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

  isRendered() {
    return this.state.render;
  }

  render() {
    if (this.props.message.fake === true) {
      return <Thread loading refDom={this.setDomElement} />;
    }

    if (this.props.message?.hidden_data?.type === 'init_channel') {
      if (!this.state.render) {
        return <div ref={this.setDomElement} />;
      }
      return (
        <FirstMessage refDom={this.setDomElement} channelId={this.props.message.channel_id || ''} />
      );
    }

    const max_responses = this.state.history;
    let previous_message: Message = this.props.message;
    let responses = Collections.get('messages')
      .findBy({
        channel_id: this.props.message.channel_id,
        parent_message_id: this.props.message.id,
        _user_ephemeral: undefined,
      })
      .sort((a: Message, b: Message) => (a.creation_date || 0) - (b.creation_date || 0));

    const linkToThread = !!this.props.message.parent_message_id && this.props.repliesAsLink;

    const showInput = this.messageEditorService.currentEditor === this.props.message?.id;

    return (
      <Thread
        refDom={this.setDomElement}
        highlighted={this.props.highlighted}
        hidden={!this.state.render}
        withBlock={!this.props.message.parent_message_id}
      >
        <ThreadSection
          small={linkToThread}
          message={this.props.message}
          head
          delayRender={!this.state.render}
        >
          <MessageContent
            key={this.props.message?._last_modified || this.props.message?.front_id}
            linkToThread={linkToThread}
            message={this.props.message}
            collectionKey={this.props.collectionKey}
          />
        </ThreadSection>

        {!this.props.noReplies && responses.length > max_responses && (
          <ThreadSection gradient>
            <div className="message-content">
              <a
                onClick={() => {
                  MessagesService.showMessage(this.props.message.id);
                }}
                href="#"
              >
                {Languages.t('scenes.apps.messages.message.show_responses_button')}
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
            return (
              <ThreadSection alinea message={message} small delayRender={!this.state.render}>
                <MessageContent message={message} collectionKey={this.props.collectionKey} />
              </ThreadSection>
            );
          })}

        {!this.props.noReplies && showInput && (
          <ThreadSection alinea small message={{ sender: UserService.getCurrentUserId() }}>
            <div className="message-content">
              <Input
                channelId={this.props.message?.channel_id || ''}
                threadId={this.props.message?.id || ''}
                collectionKey={this.props.collectionKey}
              />
            </div>
          </ThreadSection>
        )}
        {!showInput && !this.props.noReplies && !this.props.message.parent_message_id && (
          <ThreadSection compact>
            <div className="message-content">
              <a
                href="#"
                onClick={() => this.messageEditorService.openEditor(this.props.message?.id || '')}
              >
                <CornerDownRight size={14} />{' '}
                {Languages.t('scenes.apps.messages.message.reply_button')}
              </a>
            </div>
          </ThreadSection>
        )}
      </Thread>
    );
  }
}
