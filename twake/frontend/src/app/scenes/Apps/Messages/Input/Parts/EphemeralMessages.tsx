import React, { useState, useEffect } from 'react';
import { Send, Smile, AlignLeft, Video, MoreHorizontal, Paperclip } from 'react-feather';
import Languages from 'services/languages/languages.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import CurrentUser from 'services/user/current_user.js';
import MessageComponent from '../../Message/Message';
import MessagesService from 'services/Apps/Messages/Messages.js';

type Props = {
  channelId: string;
  threadId: string;
  collectionKey: string;
  onHasEphemeralMessage: () => void;
  onNotEphemeralMessage: () => void;
};

export default (props: Props) => {
  let savedList: any[] = [];

  const getEphemeralMessages = () => {
    return Collections.get('messages')
      .findBy({
        channel_id: props.channelId,
        parent_message_id: props.threadId,
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
  };

  Collections.get('messages').useListener(useState);

  let lastEphemeral: any = null;
  getEphemeralMessages().forEach((item: any) => {
    if (lastEphemeral) {
      MessagesService.deleteMessage(lastEphemeral, props.collectionKey);
    }
    lastEphemeral = item;
  });

  if (!lastEphemeral) {
    props.onNotEphemeralMessage();
    return <div />;
  }
  props.onHasEphemeralMessage();
  return (
    <div className="ephemerals" key={lastEphemeral?.front_id + lastEphemeral?.content?.last_change}>
      <div className="ephemerals_text">
        {Languages.t('scenes.apps.messages.just_you', [], 'Visible uniquement par vous')}
      </div>
      {[lastEphemeral].map((message: any) => {
        if (!message) {
          return '';
        }
        return (
          <MessageComponent
            noBlock
            noReplies
            collectionKey={props.collectionKey}
            messageId={message.id || message.front_id}
          />
        );
      })}
    </div>
  );
};
