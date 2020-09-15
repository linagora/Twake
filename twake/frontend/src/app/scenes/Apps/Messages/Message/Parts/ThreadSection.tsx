import React from 'react';
import Twacode from 'components/Twacode/Twacode.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';

type Props = {
  message: any;
};

export default (props: Props) => {
  var user = null;

  if (props.message.sender) {
    user = Collections.get('users').known_objects_by_id[props.message.sender];
    if (!user) {
      User.asyncGet(props.message.sender);
    } else {
      //Collections.get('users').listenOnly(this, [user.front_id]);
    }
  }

  return (
    <div className="thread-section">
      <div className="message">
        <div className="sender-space">
          <div
            className="sender-head"
            style={{
              backgroundImage: "url('" + User.getThumbnail(user) + "')",
            }}
          ></div>
        </div>
        <div className="message-content">
          <div className="message-content-header">
            <span className="sender-name">{User.getFullName(user)}</span>
            <span className="date">14/09 at 15h18</span>
          </div>
          <div className="content-parent">
            <Twacode
              className="content allow_selection"
              onDoubleClick={(evt: any) => {
                evt.preventDefault();
                evt.stopPropagation();
              }}
              content={MessagesService.prepareContent(
                props.message.content,
                props.message.user_specific_content,
              )}
              id={props.message.front_id}
              isApp={props.message.message_type == 1}
              after={
                props.message.edited &&
                props.message.message_type == 0 && <div className="edited">(edited)</div>
              }
              onAction={undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
