import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import ChannelsService from 'services/channels/channels.js';
import MessagesList from './MessagesList';
import './Messages.scss';
import NewThread from './Input/NewThread';
import Collections from 'services/Collections/Collections.js';
import CurrentUser from 'services/user/current_user.js';

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
    Collections.get('messages').addListener(this);
    MessagesService.addListener(this);

    this.options = props.options || {};
    this.threadId = this.options.threadId || '';
    this.collectionKey = 'messages_' + this.props.channel.id + '_' + this.threadId;
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    Collections.get('messages').removeListener(this);
    MessagesService.removeListener(this);
  }

  render() {
    var ephemerals_messages = Collections.get('messages')
      .findBy({
        channel_id: this.props.channel.id,
        parent_message_id: this.threadId,
        _user_ephemeral: true,
      })
      .filter((message: any) => {
        try {
          if (message.ephemeral_message_recipients) {
            return (message.ephemeral_message_recipients || []).indexOf(CurrentUser.get().id) >= 0;
          }
        } catch (e) {}
        return true;
      })
      .sort((a: any, b: any) => a.creation_date - b.creation_date);

    return (
      <div className="messages-view">
        <MessagesList
          threadId={this.threadId}
          channel={this.props.channel}
          collectionKey={this.collectionKey}
        />

        {ephemerals_messages.length > 0 && (
          <div className="ephemerals">
            <div className="ephemerals_text">
              {Languages.t('scenes.apps.messages.just_you', [], 'Visible uniquement par vous')}
            </div>
            {ephemerals_messages.map(message => {
              if (!message) {
                return '';
              }
              return (
                <Message
                  messagesCollectionKey={this.messages_collection_key}
                  message={message}
                  previousMessage={{}}
                  new={false}
                  measure={() => {}}
                  hasTimeline={false}
                />
              );
            })}
          </div>
        )}
        <NewThread
          useButton={!this.props.channel.direct && !this.threadId}
          collectionKey={this.collectionKey}
          channelId={this.props.channel.id}
          threadId={this.threadId}
          key="input"
        />
      </div>
    );
  }
}
