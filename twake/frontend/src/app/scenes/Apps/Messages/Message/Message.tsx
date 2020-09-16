import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLevelUpAlt } from '@fortawesome/free-solid-svg-icons';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';

import FirstMessage from './Parts/FirstMessage/FirstMessage';
import Thread from './Parts/Thread';
import ThreadSection from './Parts/ThreadSection';
import Collections from 'services/Collections/Collections.js';

type Props = {
  message: Message & { fake: boolean };
  style: any;
};

export default class MessageComponent extends Component<Props> {
  domNode: any;

  constructor(props: Props) {
    super(props);
    this.setDomElement = this.setDomElement.bind(this);
  }

  getDomElement() {
    return this.domNode;
  }

  setDomElement(node: any) {
    this.domNode = node;
  }

  render() {
    if (this.props.message.fake === true) {
      return <Thread loading refDom={this.setDomElement} />;
    }

    if (this.props.message?.hidden_data?.type === 'init_channel') {
      return (
        <FirstMessage refDom={this.setDomElement} channelId={this.props.message.channel_id || ''} />
      );
    }

    const max_responses = 5;
    let previous_message: Message = this.props.message;
    let responses = Collections.get('messages')
      .findBy({
        channel_id: this.props.message.channel_id,
        parent_message_id: this.props.message.id,
        _user_ephemeral: undefined,
      })
      .sort((a: Message, b: Message) => (a.creation_date || 0) - (b.creation_date || 0));

    return (
      <Thread refDom={this.setDomElement}>
        <ThreadSection message={this.props.message} />

        {responses.length > 5 && (
          <div className="thread-section gradient">
            <div className="message">
              <div className="sender-space" />
              <div className="message-content">
                <a>Open thread ({responses.length - max_responses} more messages)</a>
              </div>
            </div>
          </div>
        )}

        {responses.slice(-max_responses).map((message: Message) => {
          if (!message) {
            return '';
          }
          const tmp_previous_message = previous_message;
          previous_message = message;
          return <ThreadSection message={message} small />;
        })}

        <div className="thread-section compact">
          <div className="message">
            <div className="sender-space" />
            <div className="message-content">
              <a>
                <FontAwesomeIcon icon={faLevelUpAlt} className={'fa-rotate-90	fa-w-20'} /> Reply
              </a>
            </div>
          </div>
        </div>
      </Thread>
    );
  }
}
