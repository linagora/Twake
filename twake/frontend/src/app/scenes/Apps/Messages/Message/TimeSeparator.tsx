import React from 'react';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment-timezone';
import Languages from 'services/languages/languages.js';

type Props = {
  message: Message;
  previousMessage: Message;
  unreadAfter: number;
};

export default (props: Props) => {
  if (!props.previousMessage) {
    return <div />;
  }
  const isFirstNewMessage =
    (props.message?.creation_date || 0) >= props.unreadAfter &&
    (props.previousMessage?.creation_date || 0) < props.unreadAfter;
  const isNewMessage = !!(
    !props.previousMessage ||
    (props.message.creation_date && isFirstNewMessage && props.previousMessage?.creation_date)
  );
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
          !props.previousMessage ||
          (props.message?.creation_date || 0) - (props.previousMessage?.creation_date || 0) >
            60 * 60 * 2
        ) && (
          <div className="message_timeline">
            <div className="time_container">
              <div className="time">
                {(new Date().getTime() / 1000 - (props.message?.creation_date || 0) > 24 * 60 * 60
                  ? moment((props.message?.creation_date || 0) * 1000).format('LL')
                  : moment((props.message?.creation_date || 0) * 1000).fromNow()) || '-'}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
