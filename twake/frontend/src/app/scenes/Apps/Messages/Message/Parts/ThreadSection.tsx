import React from 'react';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';

type Props = {
  message?: Message;
  compact?: boolean;
  small?: boolean;
  head?: boolean;
  children?: any;
};

export default (props: Props) => {
  var user = null;

  if (props.message?.sender) {
    user = Collections.get('users').known_objects_by_id[props.message.sender];
    if (!user) {
      User.asyncGet(props.message.sender);
    } else {
      //Collections.get('users').listenOnly(this, [user.front_id]);
    }
  }

  return (
    <div
      className={
        'thread-section ' +
        (props.compact ? 'compact ' : '') +
        (props.small ? 'small-section ' : '') +
        (props.head ? 'head-section ' : '') +
        (props.message?.sender && props.message.pinned ? 'pinned-section ' : '')
      }
    >
      <div className="message">
        <div className="sender-space">
          {props.message?.sender && (
            <div
              className={'sender-head'}
              style={{
                backgroundImage: "url('" + User.getThumbnail(user) + "')",
              }}
            ></div>
          )}
        </div>
        {props.children}
      </div>
    </div>
  );
};
