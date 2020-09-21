import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessagesList from './MessagesList';
import './Messages.scss';
import NewThread from './Input/NewThread';

type Props = {
  channel: any;
  tab?: any;
  options: any;
};

export default class MainView extends Component<Props> {
  options: any = {};
  threadId: string = ''; //Non-empty = thread view
  collectionKey: string = ''; //For a specific collection (aka channel)

  constructor(props: Props) {
    super(props);
    Languages.addListener(this);
    ChannelsService.addListener(this);
    MessagesService.addListener(this);

    this.options = props.options || {};
    this.threadId = this.options.threadId || '';
    this.collectionKey = 'messages_' + this.props.channel.id + '_' + this.threadId;
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    MessagesService.removeListener(this);
  }

  render() {
    return (
      <div className="messages-view">
        <MessagesList
          threadId={this.threadId}
          channel={this.props.channel}
          collectionKey={this.collectionKey}
        />
        <NewThread
          useButton={!this.props.channel.direct}
          collectionKey={this.collectionKey}
          key="input"
        />
      </div>
    );
  }
}
