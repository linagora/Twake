import React from 'react';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import './Message.scss';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment-timezone';
import Languages from 'services/languages/languages.js';
import CurrentUser from 'services/user/current_user.js';

type Props = {
  message: Message;
  previousMessage: Message | null;
  unreadAfter: number;
};

export default (props: Props) => {
  if (!props.previousMessage) {
    return <div />;
  }
  const isFirstNewMessage =
    (props.message?.creation_date || 0) >= props.unreadAfter &&
    (props.previousMessage?.creation_date || 0) < props.unreadAfter;
  const isNewMessage =
    !!(
      !props.previousMessage ||
      (props.message.creation_date && isFirstNewMessage && props.previousMessage?.creation_date)
    ) && props.message.sender !== CurrentUser.get().id;
  const creation_date = Math.min(new Date().getTime() / 1000, props.message?.creation_date || 0);
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
                  ? moment((creation_date || 0) * 1000).format('LL')
                  : moment((creation_date || 0) * 1000).fromNow()) || '-'}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
