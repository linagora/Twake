import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessageList from './MessageList';
import NewThread from './Input/NewThread';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessageLoaderFactory';
import { ChannelResource } from 'app/models/Channel';
import { MessageLoader } from 'app/services/Apps/Messages/MessageLoader';
import './Messages.scss';

type Props = {
  channel: ChannelResource;
  tab?: any;
  options: any;
};

export default class MainView extends Component<Props> {
  options: any = {};
  /**
   * Display a thread view when non empty
   */
  threadId = '';
  collectionKey = ''; //For a specific collection (aka channel)
  upload_zone: any;
  messageLoader: MessageLoader;

  constructor(props: Props) {
    super(props);
    Languages.addListener(this);
    ChannelsService.addListener(this);
    MessagesService.addListener(this);

    this.options = props.options || {};
    this.options.context = props.options.context || {};
    this.threadId = this.options.context.threadId || '';
    this.collectionKey = `messages_${this.props.channel.id}_${this.threadId}`;
    this.messageLoader = MessagesListServerServicesManager.get(
      this.props.channel.data.company_id || '',
      this.props.channel.data.workspace_id || '',
      this.props.channel.id,
      this.threadId,
      this.collectionKey,
    )
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    MessagesService.removeListener(this);
  }

  render() {
    const unreadAfter = this.props.channel.data.user_member?.last_access || new Date().getTime();
    return (
      <div
        className="messages-view"
        onClick={() => this.messageLoader.readChannelOrThread()}
      >
        <MessageList
          threadId={this.threadId}
          channel={this.props.channel.data}
          collectionKey={this.collectionKey}
          unreadAfter={unreadAfter}
          scrollDirection={this.threadId ? 'down' : 'up'}
        />
        <DroppableZone
          className="bottom_input"
          types={['message']}
          onDrop={(data: any) => MessagesService.dropMessage(data.data, null, this.collectionKey)}
        >
          <NewThread
            useButton={this.props.channel.data.visibility !== 'direct' && !this.threadId}
            collectionKey={this.collectionKey}
            channelId={this.props.channel.id}
            threadId={this.threadId}
          />
        </DroppableZone>
      </div>
    );
  }
}
