import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import _ from 'lodash';
import { useAddMessageToChannel, useRemoveMessageFromChannel } from './useChannelMessages';
import { useSetMessage } from './useMessage';
import { useAddMessageToThread, useRemoveMessageFromThread } from './useThreadMessages';

export const useAddMessage = (key: {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
}) => {
  const addToThread = useAddMessageToThread(key.companyId);
  const removeFromThread = useRemoveMessageFromThread(key.companyId);
  const channelKey = {
    companyId: key.companyId,
    workspaceId: key.workspaceId || '',
    channelId: key.channelId || '',
  };
  const addToChannel = useAddMessageToChannel(channelKey);
  const removeFromChannel = useRemoveMessageFromChannel(channelKey);
  const setMessage = useSetMessage(key.companyId);

  return (message: NodeMessage) => {
    const isThread = message.thread_id === message.id;

    console.log('addMessage', message, isThread, message._status === 'sent');

    setMessage(messageToMessageWithReplies(message));
    if (message._status === 'sent') {
      if (!isThread) removeFromThread([message]);
      if (isThread) removeFromChannel([message]);
    } else {
      if (!isThread) addToThread([message], { atBottom: true });
      if (isThread) addToChannel([message], { atBottom: true });
    }
  };
};

/**
 * This convert a NodeMessage to a MessageWithReply type to make things easier
 */
export const messageToMessageWithReplies = (m: NodeMessage | MessageWithReplies) => {
  const mwr: MessageWithReplies = {
    ...m,
    last_replies: (m as MessageWithReplies)?.last_replies || [],
    stats: (m as MessageWithReplies)?.stats || { last_activity: m.created_at, replies: 0 },
  };
  return mwr;
};
