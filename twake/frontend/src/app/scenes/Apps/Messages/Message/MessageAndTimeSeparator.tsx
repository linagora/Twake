import { ChannelResource } from 'app/models/Channel';
import {
  useChannelMessages,
  useMessage,
  useThreadMessages,
} from 'app/state/recoil/hooks/useMessages';
import React from 'react';
import Message from './Message';
import TimeSeparator from './TimeSeparator';

type Props = {
  fake?: boolean;
  messageId: string;
  previousMessageId: string;
  collectionKey: string;
  highlighted?: boolean;
  style?: React.CSSProperties;
  deleted?: boolean;
  /**
   * Deprecated
   */
  delayRender?: boolean;
  noReplies?: boolean;
  noBlock?: boolean;
  repliesAsLink?: boolean;
  unreadAfter: number;
  threadHeader?: string;
  channel: ChannelResource;
};

export default React.memo((props: Props) => {
  const message = useMessage({
    id: props.messageId,
    threadId: props.messageId,
    companyId: props.channel.data.company_id || '',
  });
  console.log('message: ', message);

  const channelMessages = useChannelMessages({
    channelId: props.channel.data.id || '',
    workspaceId: props.channel.data.workspace_id || '',
    companyId: props.channel.data.company_id || '',
  });
  console.log('messages: ', channelMessages);

  const threadMessages = useThreadMessages({
    threadId: props.messageId,
    companyId: props.channel.data.company_id || '',
  });
  console.log('thread: ', threadMessages);

  return (
    <>
      <TimeSeparator
        key={'time'}
        messageId={props.messageId}
        previousMessageId={props.previousMessageId}
        unreadAfter={props.unreadAfter}
      />
      <Message
        deleted={props.deleted}
        noReplies={props.noReplies}
        fake={props.fake}
        repliesAsLink={props.repliesAsLink}
        key="message"
        messageId={props.messageId}
        threadHeader={props.threadHeader}
        highlighted={props.highlighted}
        collectionKey={props.collectionKey}
        unreadAfter={props.unreadAfter}
      />
    </>
  );
});
