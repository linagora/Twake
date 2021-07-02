import React, { useState } from 'react';
import Languages from 'services/languages/languages.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import CurrentUser from 'app/services/user/CurrentUser';
import MessageComponent from '../../Message/Message';
import MessagesService from 'services/Apps/Messages/Messages';

type Props = {
  channelId: string;
  threadId: string;
  collectionKey: string;
  onHasEphemeralMessage: () => void;
  onNotEphemeralMessage: () => void;
};

export default (props: Props) => {
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
      {lastEphemeral && (
        <MessageComponent
          noBlock
          noReplies
          key={lastEphemeral.id + lastEphemeral.modification_date}
          collectionKey={props.collectionKey}
          messageId={lastEphemeral.id || lastEphemeral.front_id}
        />
      )}
    </div>
  );
};
