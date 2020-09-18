import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import Moment from 'react-moment';
import moment from 'moment';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import ChannelsService from 'services/channels/channels.js';

type Props = {
  message: Message;
  collectionKey: string;
};

export default (props: Props) => {
  const [active, setActive] = useState(false);
  const [messageLink, setMessageLink] = useState('');

  const updateMessageLink = () => {
    const url = ChannelsService.getURL(
      props.message.channel_id,
      props.message.parent_message_id || props.message.id,
    );
    setMessageLink(url);
  };

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
    <div
      className={'message-content ' + (active ? 'active ' : '')}
      onClick={() => setActive(false)}
    >
      <div className="message-content-header">
        <span className="sender-name">{User.getFullName(user)}</span>
        {props.message.creation_date && (
          <a className="date" href={messageLink || '#'} onMouseEnter={() => updateMessageLink()}>
            <Moment
              tz={moment.tz.guess()}
              format={
                new Date().getTime() - props.message.creation_date * 1000 > 12 * 60 * 60 * 1000
                  ? 'lll'
                  : 'LT'
              }
            >
              {props.message.creation_date * 1000}
            </Moment>
          </a>
        )}
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
        <Reactions message={props.message} collectionKey={props.collectionKey} />
      </div>
      <Options
        message={props.message}
        collectionKey={props.collectionKey}
        onOpen={() => setActive(true)}
        onClose={() => setActive(false)}
      />
    </div>
  );
};
