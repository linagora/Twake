import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessagesList from './MessagesList';
import './Messages.scss';
import NewThread from './Input/NewThread';
import Collections from 'services/Collections/Collections.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';

type Props = {
  channel: any;
  tab?: any;
  options: any;
};

export default class MainView extends Component<Props> {
  options: any = {};
  threadId: string = ''; //Non-empty = thread view
  collectionKey: string = ''; //For a specific collection (aka channel)
  upload_zone: any;

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
    const unreadAfter = ChannelsService.channel_front_read_state[this.props.channel.id];
    return (
      <div className="messages-view">
        <MessagesList
          threadId={this.threadId}
          channel={this.props.channel}
          collectionKey={this.collectionKey}
          unreadAfter={unreadAfter}
        />
        <DroppableZone
          className="bottom_input"
          types={['message']}
          onDrop={(data: any) => MessagesService.dropMessage(data.data, null, this.collectionKey)}
        >
          <NewThread
            useButton={!this.props.channel.direct && !this.threadId}
            collectionKey={this.collectionKey}
            channelId={this.props.channel.id}
            threadId={this.threadId}
          />
        </DroppableZone>
      </div>
    );
  }
}
