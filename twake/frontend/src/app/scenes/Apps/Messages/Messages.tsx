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
import Notifications from 'services/user/notifications';
import Collections from 'app/services/CollectionsReact/Collections';
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
  readChannelTimeout: any;

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
    );
  }

  // TODO: Move it to a service
  readChannelOrThread() {
    //if (this.readChannelTimeout) {
    //  clearTimeout(this.readChannelTimeout);
    //}
    //// TODO Expose it from this.messageLoader
    //if (this.lastReadMessage === this.lastMessageOffset) {
    //  return;
    //}
    //this.readChannelTimeout = setTimeout(() => {
    //  const path = `/channels/v1/companies/${this.props.channel.data.company_id}/workspaces/${this.props.channel.data.workspace_id}/channels/::mine`;
    //  const collection = Collections.get(path, ChannelResource);
    //  const channel = collection.findOne({ id: this.props.channel.id }, { withoutBackend: true });
    //  this.lastReadMessage = this.lastMessageOffset;
    //  Notifications.read(channel);
    //}, 500);
  }

  componentDidMount() {
    // TODO: Mask it has read once the MessageList is loaded
    // TODO: The event must come from the component itself
    this.readChannelOrThread();
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
        onClick={() => this.readChannelOrThread()}
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
