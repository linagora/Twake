import React, { Component } from 'react';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';

import FirstMessage from './Parts/FirstMessage/FirstMessage';
import Thread from './Parts/Thread';
import ThreadSection from './Parts/ThreadSection';

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

    return (
      <Thread refDom={this.setDomElement}>
        <ThreadSection message={this.props.message} />
        <div className="thread-section compact">
          <div className="message">
            <div className="sender-space" />
            <div className="message-content">
              <a>Reply</a>
            </div>
          </div>
        </div>
      </Thread>
    );
  }
}
