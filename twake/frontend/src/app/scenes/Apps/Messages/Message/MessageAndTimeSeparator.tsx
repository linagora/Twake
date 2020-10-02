import React from 'react';
import MessageComponent from './Message';
import TimeSeparator from './TimeSeparator';
import { Message } from 'services/Apps/Messages/MessagesListServerUtils';

type Props = {
  message: Message & { fake: boolean };
  previousMessage: (Message & { fake: boolean }) | null;
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

export default (props: Props) => {
  return (
    <>
      <TimeSeparator
        key={'time'}
        message={props.message}
        previousMessage={props.previousMessage}
        unreadAfter={props.unreadAfter}
      />
      <MessageComponent
        delayRender
        repliesAsLink={props.repliesAsLink}
        key="message"
        message={props.message}
        highlighted={props.highlighted}
        ref={props.refMessage}
        collectionKey={props.collectionKey}
        unreadAfter={props.unreadAfter}
      />
    </>
  );
};
