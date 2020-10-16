import React, { useState } from 'react';
import './Message.scss';
import moment from 'moment';
import 'moment-timezone';
import Languages from 'services/languages/languages.js';
import CurrentUser from 'services/user/current_user.js';
import Collections from 'services/Collections/Collections.js';

type Props = {
  messageId: string;
  previousMessageId: string;
  unreadAfter: number;
};

export default React.memo((props: Props) => {
  if (!props.previousMessageId) {
    return <div />;
  }

  const previousMessage = Collections.get('messages').find(props.previousMessageId);
  const message = Collections.get('messages').find(props.messageId);

  Collections.get('messages').useListener(useState, [props.messageId, props.previousMessageId]);

  const isFirstNewMessage =
    (message?.creation_date || 0) >= props.unreadAfter &&
    (previousMessage?.creation_date || 0) < props.unreadAfter;
  const isNewMessage =
    !!(
      !previousMessage ||
      (message?.creation_date && isFirstNewMessage && previousMessage?.creation_date)
    ) && message?.sender !== CurrentUser.get().id;
  const creation_date = Math.min(new Date().getTime() / 1000, message?.creation_date || 0);
  return (
    <div>
      {isNewMessage && (
        <div className="message_timeline new_messages">
          <div className="time_container">
            <div className="time">
              {Languages.t('scenes.apps.messages.message.new_messages_bar', [], 'New messages')}
            </div>
          </div>
        </div>
      )}
      {!isNewMessage &&
        !!(
          !previousMessage ||
          (message?.creation_date || 0) - (previousMessage?.creation_date || 0) > 60 * 60 * 2
        ) && (
          <div className="message_timeline">
            <div className="time_container">
              <div className="time">
                {(new Date().getTime() / 1000 - (message?.creation_date || 0) > 24 * 60 * 60
                  ? moment((creation_date || 0) * 1000).format('LL')
                  : moment((creation_date || 0) * 1000).fromNow()) || '-'}
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
