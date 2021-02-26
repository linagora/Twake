import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessagesList from './MessagesList';
import './Messages.scss';
import NewThread from './Input/NewThread';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import MessagesListServerServicesManager from 'app/services/Apps/Messages/MessagesListServerUtils';
import Collections from 'app/services/Collections/Collections';
import { ChannelResource } from 'app/models/Channel';

type Props = {
  channel: ChannelResource;
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
    this.options.context = props.options.context || {};
    this.threadId = this.options.context.threadId || '';
    this.collectionKey = 'messages_' + this.props.channel.id + '_' + this.threadId;
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
        onClick={() => {
          //Mark channel as read
          const messagesListServerService = MessagesListServerServicesManager.get(
            this.props.channel.data.company_id || '',
            this.props.channel.data.workspace_id || '',
            this.props.channel.id,
            this.threadId,
            this.collectionKey,
          );
          messagesListServerService.readChannelOrThread();
        }}
      >
        <MessagesList
          threadId={this.threadId}
          channel={this.props.channel.data}
          collectionKey={this.collectionKey}
          unreadAfter={unreadAfter}
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
