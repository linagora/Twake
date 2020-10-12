import React, { useEffect, useRef } from 'react';
import MessageComponent from './Message';
import TimeSeparator from './TimeSeparator';
import { Message } from 'services/Apps/Messages/MessagesListServerUtils';

type Props = {
  fake?: boolean;
  messageId: string;
  previousMessageId: string;
  collectionKey: string;
  highlighted?: boolean;
  style?: any;
  delayRender?: boolean;
  noReplies?: boolean;
  noBlock?: boolean;
  repliesAsLink?: boolean;
  unreadAfter: number;
  refMessage?: (node: any) => void;
};

export default React.memo((props: Props) => {
  return (
    <>
      <TimeSeparator
        key={'time'}
        messageId={props.messageId}
        previousMessageId={props.previousMessageId}
        unreadAfter={props.unreadAfter}
      />
      <MessageComponent
        fake={props.fake}
        delayRender
        repliesAsLink={props.repliesAsLink}
        key="message"
        messageId={props.messageId}
        highlighted={props.highlighted}
        collectionKey={props.collectionKey}
        unreadAfter={props.unreadAfter}
      />
    </>
  );
});
