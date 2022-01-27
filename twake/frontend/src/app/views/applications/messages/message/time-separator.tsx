import React from 'react';
import Moment from 'react-moment';
import 'moment-timezone';

import Languages from 'app/features/global/services/languages-service';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import './message.scss';
import { useMessage } from 'app/features/messages/hooks/use-message';
import { AtomMessageKey } from 'app/features/messages/state/atoms/messages';

type Props = {
  messageId: AtomMessageKey;
  previousMessageId: AtomMessageKey;
  unreadAfter: number;
};

export default React.memo((props: Props) => {
  const { message } = useMessage(props.messageId);
  const previousMessage = props.previousMessageId
    ? useMessage(props.previousMessageId).message
    : null;

  const isFirstNewMessage =
    (message?.created_at || 0) >= props.unreadAfter &&
    (previousMessage?.created_at || 0) < props.unreadAfter;
  const isNewMessage =
    !!(
      previousMessage &&
      message?.created_at &&
      isFirstNewMessage &&
      previousMessage?.created_at
    ) && message?.user_id !== CurrentUser.get().id;
  const creation_date = Math.min(new Date().getTime(), message?.created_at || 0);
  return (
    <div className="time_separator">
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
          (message?.created_at || 0) - (previousMessage?.created_at || 0) > 60 * 60 * 2 * 1000
        ) && (
          <div className="message_timeline">
            <div className="time_container">
              <div className="time">
                {new Date().getTime() - (message?.created_at || 0) > 24 * 60 * 60 * 1000 ? (
                  <Moment date={creation_date || 0} format="LL"></Moment>
                ) : (
                  <Moment date={creation_date || 0} fromNow></Moment>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
});
