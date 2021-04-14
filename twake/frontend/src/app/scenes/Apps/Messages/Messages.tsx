import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessageList from './MessageList';
import NewThread from './Input/NewThread';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import { ChannelResource } from 'app/models/Channel';
import { MessageListService } from 'app/services/Apps/Messages/MessageListService';
import MessageListServiceFactory from 'app/services/Apps/Messages/MessageListServiceFactory';
import RouterServices from 'app/services/RouterService';
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

  /**
   * Start at the given message id. Does not work when threadId is defined.
   */
  startAtOffset = '';
  collectionKey: string;
  /**
   * Avoid to render until everything needed is ready
   */
  ready = false;
  upload_zone: any;
  messageService: MessageListService;

  constructor(props: Props) {
    super(props);
    Languages.addListener(this);
    ChannelsService.addListener(this);
    MessagesService.addListener(this);

    this.options = props.options || {};
    this.options.context = props.options.context || {};
    this.threadId = this.options.context.threadId || '';
    this.collectionKey = `messages@channel:${this.props.channel.id}/thread:${this.threadId}`;
    this.messageService = MessageListServiceFactory.get(this.collectionKey, this.props.channel);
  }

  componentDidMount(): void {
    this.startAtOffset = RouterServices.getStateFromRoute().messageId || '';
    this.ready = true;
  }

  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    MessagesService.removeListener(this);
    this.ready = false;
  }

  render() {
    const unreadAfter = this.props.channel.data.user_member?.last_access || new Date().getTime();

    return this.ready
      ? (
      <div
        className="messages-view"
        onClick={() => this.messageService.markChannelAsRead()}
      >
        <MessageList
          startAt={this.startAtOffset}
          threadId={this.threadId}
          channel={this.props.channel}
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
    )
    : (<></>);
  }
}
