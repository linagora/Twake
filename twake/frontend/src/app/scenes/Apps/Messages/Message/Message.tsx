import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLevelUpAlt } from '@fortawesome/free-solid-svg-icons';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';

import FirstMessage from './Parts/FirstMessage/FirstMessage';
import Thread from './Parts/Thread';
import ThreadSection from './Parts/ThreadSection';
import MessageContent from './Parts/MessageContent';

import Collections from 'services/Collections/Collections.js';

type Props = {
  message: Message & { fake: boolean };
  highlighted?: boolean;
  style: any;
};

export default class MessageComponent extends Component<
  Props,
  { history: number; render: boolean }
> {
  domNode: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      history: 5,
      render: false,
    };

    this.setDomElement = this.setDomElement.bind(this);
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

    return (
      <Thread
        refDom={this.setDomElement}
        highlighted={this.props.highlighted}
        hidden={!this.state.render}
      >
        <ThreadSection message={this.props.message} head delayRender={!this.state.render}>
          <MessageContent message={this.props.message} />
        </ThreadSection>

        {responses.length > max_responses && (
          <ThreadSection gradient>
            <div className="message-content">
              <a
                onClick={() => {
                  this.setState({ history: 10 });
                }}
                href="#"
              >
                Open thread ({responses.length - max_responses} more messages)
              </a>
            </div>
          </ThreadSection>
        )}

        {responses.slice(-max_responses).map((message: Message) => {
          if (!message) {
            return '';
          }
          const tmp_previous_message = previous_message;
          previous_message = message;
          return (
            <ThreadSection message={message} small delayRender={!this.state.render}>
              <MessageContent message={message} />
            </ThreadSection>
          );
        })}

        <ThreadSection compact>
          <div className="message-content">
            <a>
              <FontAwesomeIcon
                icon={faLevelUpAlt}
                style={{ transform: 'scale(0.75) rotate(90deg)', width: '0.8em' }}
                className={'fa-rotate-90	fa-w-20'}
              />{' '}
              Reply
            </a>
          </div>
        </ThreadSection>
      </Thread>
    );
  }
}
