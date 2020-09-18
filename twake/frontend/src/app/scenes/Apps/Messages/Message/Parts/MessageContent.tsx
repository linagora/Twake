import React, { useState } from 'react';
import Twacode from 'components/Twacode/Twacode.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Reactions from './Reactions';
import Options from './Options';
import MessageHeader from './MessageHeader';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
};

export default (props: Props) => {
  const [active, setActive] = useState(false);

  return (
    <div
      className={
        'message-content ' +
        (active ? 'active ' : '') +
        (props.linkToThread ? 'link-to-thread ' : '')
      }
      onClick={() => setActive(false)}
    >
      <MessageHeader
        message={props.message}
        collectionKey={props.collectionKey}
        linkToThread={props.linkToThread}
      />
      <div className="content-parent dont-break-out">
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
